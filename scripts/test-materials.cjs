const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { Blob } = require('node:buffer');
const { randomUUID } = require('node:crypto');

function load(file, overrides = {}, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const variables = { Date, Set, Map, Blob, console, setTimeout, crypto: { randomUUID }, ...globals };
  new Function('exports', 'require', ...Object.keys(variables), source)(module.exports,
    name => name in overrides ? overrides[name] : require(name), ...Object.values(variables));
  return module.exports;
}
const stock = load('lib/materialStock.ts');
const initial = { initialStock: 100, receivedTotal: 0, usedTotal: 0, stock: 100 };

test('stock incoming and decimal usage preserve the stock equation', () => {
  const after = stock.applyStockMovement(initial, 'incoming', 0.2);
  const used = stock.applyStockMovement(after, 'usage', 0.3);
  assert.equal(used.stock, 99.9);
  assert.equal(used.usedTotal, 0.3);
  assert.equal(used.delta, -0.3);
});
test('overuse, negative amounts, nonfinite numbers and excessive precision are rejected', () => {
  for (const quantity of [101, -1, NaN, Infinity, 0.0001]) assert.throws(() => stock.applyStockMovement(initial, 'usage', quantity));
});
test('usage corrections restore only the difference and do not edit the original', () => {
  const original = { type: 'usage', quantity: 15 };
  const after = stock.applyStockMovement({ ...initial, usedTotal: 15, stock: 85 }, 'correction', 10, original);
  assert.equal(after.stock, 90); assert.equal(after.usedTotal, 10); assert.equal(after.delta, 5);
  assert.equal(original.quantity, 15);
});
test('incoming/initial corrections cannot make stock negative; purpose-only corrections preserve stock', () => {
  assert.throws(() => stock.applyStockMovement({ ...initial, usedTotal: 90, stock: 10 }, 'correction', 80, { type: 'initial', quantity: 100 }));
  const same = stock.applyStockMovement(initial, 'correction', 100, { type: 'initial', quantity: 100 });
  assert.equal(same.delta, 0);
  assert.throws(() => stock.applyStockMovement(initial, 'correction', 10, { type: 'correction', quantity: 5 }));
});
test('periods validate real dates, reversed ranges and leap years', () => {
  assert.throws(() => stock.validateMaterialPeriod('2026-02-30', '2026-03-05'));
  assert.throws(() => stock.validateMaterialPeriod('2026-03-05', '2026-03-01'));
  assert.throws(() => stock.validateMaterialPeriod('2020-01-01', '2026-01-01'));
  assert.equal(stock.materialDate(stock.validateMaterialPeriod('2024-02-29', '2024-02-29').until), '2024-03-01');
});

function fixture() {
  const documents = new Map();
  const current = { uid: 'uid-admin', role: 'admin' };
  const db = {};
  let tail = Promise.resolve();
  let stamp = 0;
  const failures = { failNextBatch: false };
  const ref = (...args) => {
    const segments = args.flatMap(value => typeof value === 'string' ? [value] : value?.path ? [value.path] : []);
    const documentPath = segments.join('/');
    return { path: documentPath, id: documentPath.split('/').pop() };
  };
  const snapshot = target => ({ exists: () => documents.has(target.path), data: () => documents.get(target.path), id: target.id });
  const firestore = {
    collection: ref, doc: ref,
    getDoc: async target => target.path === `users/${current.uid}` ? { exists: () => true, data: () => ({ role: current.role, name: current.uid }) } : snapshot(target),
    serverTimestamp: () => { const value = ++stamp; return { toMillis: () => value }; },
    where: (field, op, value) => ({ field, op, value }),
    limit: count => ({ count }),
    orderBy: () => ({}),
    startAfter: cursor => ({ cursor }),
    Timestamp: { fromDate: date => ({ toMillis: () => date.getTime() }) },
    query: (target, ...filters) => ({ ...target, filters: [...(target.filters || []), ...filters] }),
    getDocs: async target => {
      let rows = [...documents.entries()].filter(([key]) => key.startsWith(target.path + '/') && !key.slice(target.path.length + 1).includes('/'));
      for (const filter of target.filters || []) {
        if (filter.field) rows = rows.filter(([, data]) => {
          const left = data[filter.field]?.toMillis?.() ?? data[filter.field];
          const right = filter.value?.toMillis?.() ?? filter.value;
          return filter.op === '==' ? left === right : filter.op === '>=' ? left >= right : left < right;
        });
        if (filter.count) rows = rows.slice(0, filter.count);
      }
      const docs = rows.map(([key]) => ({ ...snapshot(ref(key)), ref: ref(key) }));
      return { docs, empty: docs.length === 0, size: docs.length };
    },
    writeBatch: () => {
      const targets = [];
      return { delete: target => targets.push(target), commit: async () => {
        if (failures.failNextBatch) { failures.failNextBatch = false; throw new Error('Temporary failure'); }
        targets.forEach(target => documents.delete(target.path));
      } };
    },
    runTransaction: async (_, callback) => {
      const operation = tail.then(async () => {
        const writes = [];
        await callback({
          get: async target => snapshot(target),
          set: (target, data) => writes.push([target, data]),
          update: (target, data) => writes.push([target, { ...documents.get(target.path), ...data }]),
        });
        writes.forEach(([target, data]) => documents.set(target.path, data));
      });
      tail = operation.catch(() => {});
      return operation;
    },
  };
  const service = load('lib/firestore/materials.ts', {
    'firebase/auth': { getAuth: () => ({ currentUser: { uid: current.uid, email: 'account@test.local' } }) },
    'firebase/firestore': firestore,
    '../firebaseClient': { getFirebaseClient: () => ({ db, app: {} }), getFirebaseStorage: async () => ({}) },
    '../materialStock': stock,
    'firebase/storage': { ref, uploadBytes: async () => {}, getDownloadURL: async target => `https://firebasestorage.googleapis.com/${target.path}` },
  }, {
    createImageBitmap: async () => ({ width: 100, height: 100, close: () => {} }),
    document: { createElement: () => ({ getContext: () => ({ fillRect() {}, drawImage() {} }), toBlob: callback => callback(new Blob(['image'])) }) },
  });
  const make = (type, quantity, extra = {}) => ({ operationId: randomUUID(), type, quantity,
    photo: { type: 'image/jpeg', size: 1024 }, purpose: 'Pengecoran lantai', ...extra });
  async function seed() {
    const input = make('initial', 100, { name: 'Semen', unit: 'sak' });
    await service.submitMaterial('diana', input);
    return input.operationId;
  }
  const material = (id, project = 'diana') => documents.get(`materialProjects/${project}/materials/${id}`);
  return { service, documents, current, make, seed, material, failures };
}

test('creation writes stock and immutable ledger together, isolated by project', async () => {
  const f = fixture(); const id = await f.seed();
  assert.equal(f.material(id).stock, 100);
  assert.equal(f.material(id, 'bisma'), undefined);
  assert.equal(f.documents.get(`materialProjects/diana/movements/${id}`).afterStock, 100);
});
test('worker cannot create stock, receive stock or correct another transaction', async () => {
  const f = fixture(); const id = await f.seed(); f.current.role = 'pelaksana';
  for (const type of ['initial', 'incoming', 'correction']) await assert.rejects(f.service.submitMaterial('diana', f.make(type, 5, { materialId: id, name: 'Baru', unit: 'kg', correctionOf: id })), /izin/);
  assert.equal(f.material(id).stock, 100);
});
test('concurrent usages cannot overdraw the stock; failed operation leaves no partial writes', async () => {
  const f = fixture(); const id = await f.seed(); f.current.role = 'pelaksana';
  const results = await Promise.allSettled([70, 50].map(quantity => f.service.submitMaterial('diana', f.make('usage', quantity, { materialId: id }))));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert(f.material(id).stock >= 0);
  assert.equal(f.documents.size, 3); // material + initial event + one usage
});
test('same operation ID is idempotent even when sent concurrently', async () => {
  const f = fixture(); const id = await f.seed();
  const input = f.make('usage', 15, { materialId: id });
  await Promise.all([f.service.submitMaterial('diana', input), f.service.submitMaterial('diana', input)]);
  await f.service.submitMaterial('diana', input);
  assert.equal(f.material(id).stock, 85);
  assert.equal(f.documents.size, 3);
});
test('correction records preserve original quantities and reject a second correction', async () => {
  const f = fixture(); const id = await f.seed();
  const use = f.make('usage', 15, { materialId: id }); await f.service.submitMaterial('diana', use);
  await f.service.submitMaterial('diana', f.make('correction', 10, { materialId: id, correctionOf: use.operationId }));
  assert.equal(f.material(id).stock, 90);
  assert.equal(f.documents.get(`materialProjects/diana/movements/${use.operationId}`).quantity, 15);
  await assert.rejects(f.service.submitMaterial('diana', f.make('correction', 5, { materialId: id, correctionOf: use.operationId })), /sudah dikoreksi/);
  assert.equal(f.material(id).stock, 90);
});
test('failed negative correction rolls back the correction marker as well as the stock', async () => {
  const f = fixture(); const id = await f.seed();
  await f.service.submitMaterial('diana', f.make('usage', 90, { materialId: id }));
  await assert.rejects(f.service.submitMaterial('diana', f.make('correction', 80, { materialId: id, correctionOf: id })), /tidak mencukupi/);
  assert.equal(f.material(id).stock, 10);
  assert.equal(f.documents.has(`materialProjects/diana/corrections/${id}`), false);
});
test('admin can edit metadata without changing stock or rewriting the original event', async () => {
  const f = fixture(); const id = await f.seed();
  const input = { operationId: randomUUID(), materialId: id, action: 'edit', name: 'Semen Portland', unit: 'sak' };
  await f.service.manageMaterial('diana', input);
  assert.equal(f.material(id).name, 'Semen Portland');
  assert.equal(f.material(id).stock, 100);
  assert.equal(f.documents.get(`materialProjects/diana/movements/${id}`).materialName, 'Semen');
  const change = f.documents.get(`materialProjects/diana/materialChanges/${input.operationId}`);
  assert.equal(change.before.name, 'Semen'); assert.equal(change.after.name, 'Semen Portland');
});
test('unit can be corrected before further transactions but locks after usage', async () => {
  const f = fixture(); const id = await f.seed();
  await f.service.manageMaterial('diana', { operationId: randomUUID(), materialId: id, action: 'edit', name: 'Semen', unit: 'kg' });
  assert.equal(f.material(id).unit, 'kg');
  await f.service.submitMaterial('diana', f.make('usage', 1, { materialId: id }));
  await assert.rejects(f.service.manageMaterial('diana', { operationId: randomUUID(), materialId: id, action: 'edit', name: 'Semen', unit: 'sak' }), /Satuan tidak dapat diubah/);
  assert.equal(f.material(id).unit, 'kg');
});
test('workers cannot edit or delete materials', async () => {
  const f = fixture(); const id = await f.seed(); f.current.role = 'pelaksana';
  for (const action of ['edit', 'delete']) await assert.rejects(f.service.manageMaterial('diana', { operationId: randomUUID(), materialId: id, action, name: 'Salah', unit: 'sak' }), /izin/);
  assert.equal(f.material(id).isDeleted, undefined);
});
test('delete preserves stock and history and rejects usage from a stale form', async () => {
  const f = fixture(); const id = await f.seed();
  await f.service.manageMaterial('diana', { operationId: randomUUID(), materialId: id, action: 'delete' });
  assert.equal(f.material(id).isDeleted, true); assert.equal(f.material(id).stock, 100);
  assert(f.documents.has(`materialProjects/diana/movements/${id}`));
  await assert.rejects(f.service.submitMaterial('diana', f.make('usage', 1, { materialId: id })), /sudah dihapus/);
  await assert.rejects(f.service.submitMaterial('diana', f.make('incoming', 1, { materialId: id })), /sudah dihapus/);
  assert.equal(f.material(id).stock, 100);
});
test('retrying delete is idempotent and editing a deleted material is rejected', async () => {
  const f = fixture(); const id = await f.seed();
  const input = { operationId: randomUUID(), materialId: id, action: 'delete' };
  await Promise.all([f.service.manageMaterial('diana', input), f.service.manageMaterial('diana', input)]);
  await f.service.manageMaterial('diana', input);
  assert.equal(f.documents.size, 3);
  await assert.rejects(f.service.manageMaterial('diana', { operationId: randomUUID(), materialId: id, action: 'edit', name: 'Semen', unit: 'sak' }), /sudah dihapus/);
});
test('permanent history deletion requires an explicit confirmation and admin role', async () => {
  const f = fixture(); const id = await f.seed();
  const input = { operationId: randomUUID(), materialId: id, action: 'delete', removeHistory: true };
  await assert.rejects(f.service.manageMaterial('diana', input), /Ketik HAPUS/);
  assert.equal(f.material(id).isDeleted, undefined);
  f.current.role = 'pelaksana';
  await assert.rejects(f.service.manageMaterial('diana', { ...input, confirmation: 'HAPUS' }), /izin/);
});
test('delete-with-history removes movements and corrections across the whole material, preserving other projects', async () => {
  const f = fixture(); const id = await f.seed();
  const use = f.make('usage', 5, { materialId: id }); await f.service.submitMaterial('diana', use);
  await f.service.submitMaterial('diana', f.make('correction', 3, { materialId: id, correctionOf: use.operationId }));
  await f.service.submitMaterial('bisma', f.make('initial', 50, { operationId: id, name: 'Semen', unit: 'sak' }));
  await f.service.manageMaterial('diana', { operationId: randomUUID(), materialId: id, action: 'delete', removeHistory: true, confirmation: 'HAPUS' });
  assert.equal(f.material(id).historyDeleted, true); assert.equal(f.material(id).historyPurgePending, false);
  assert.equal([...f.documents.keys()].filter(key => key.startsWith('materialProjects/diana/movements/')).length, 0);
  assert.equal([...f.documents.keys()].filter(key => key.startsWith('materialProjects/diana/corrections/')).length, 0);
  assert(f.documents.has(`materialProjects/bisma/movements/${id}`));
  assert.equal(f.material(id, 'bisma').stock, 50);
});
test('history of an already soft-deleted material can be deleted later', async () => {
  const f = fixture(); const id = await f.seed();
  await f.service.manageMaterial('diana', { operationId: randomUUID(), materialId: id, action: 'delete' });
  await f.service.manageMaterial('diana', { operationId: randomUUID(), materialId: id, action: 'delete', removeHistory: true, confirmation: 'HAPUS' });
  assert.equal(f.documents.has(`materialProjects/diana/movements/${id}`), false);
});
test('batch failure leaves a resumable marker and retry completes without restoring deleted history', async () => {
  const f = fixture(); const id = await f.seed(); f.failures.failNextBatch = true;
  const input = { operationId: randomUUID(), materialId: id, action: 'delete', removeHistory: true, confirmation: 'HAPUS' };
  await assert.rejects(f.service.manageMaterial('diana', input), /belum selesai/);
  assert.equal(f.material(id).historyPurgePending, true);
  const hidden = await f.service.fetchMaterialMovements('diana', '1970-01-01', '1970-01-02');
  assert.equal(hidden.length, 0);
  await f.service.manageMaterial('diana', input);
  assert.equal(f.material(id).historyPurgePending, false);
  assert.equal(f.documents.has(`materialProjects/diana/movements/${id}`), false);
});
test('purge handles more than one batch and does not remove another material history', async () => {
  const f = fixture(); const id = await f.seed();
  for (let i = 0; i < 450; i++) f.documents.set(`materialProjects/diana/movements/test-${i}`, { materialId: id });
  f.documents.set('materialProjects/diana/movements/other', { materialId: 'other-material' });
  await f.service.manageMaterial('diana', { operationId: randomUUID(), materialId: id, action: 'delete', removeHistory: true, confirmation: 'HAPUS' });
  assert.equal([...f.documents.keys()].filter(key => key.startsWith('materialProjects/diana/movements/')).length, 1);
  assert(f.documents.has('materialProjects/diana/movements/other'));
});
test('Excel contains readable stock/history sheets and photo hyperlinks without embedded images', async () => {
  let output;
  let filename;
  const module = load('lib/materialExport.ts', { './materialStock': stock }, {
    URL: { createObjectURL: blob => { output = blob; return 'blob:test'; }, revokeObjectURL() {} },
    document: { createElement: () => ({ set download(name) { filename = name; }, click() {} }) },
    setTimeout: callback => callback(),
  });
  const photoUrl = 'https://firebasestorage.googleapis.com/test.jpg';
  await module.exportMaterialWorkbook('diana', [{ id: 'm1', name: 'Semen', unit: 'sak', ...initial, photoUrl, isDeleted: true }], [{
    id: 'e1', materialId: 'm1', materialName: 'Semen', unit: 'sak', type: 'usage', quantity: 15, delta: -15,
    beforeStock: 100, afterStock: 85, purpose: 'Lantai 2', actorName: 'Pengawas A', photoUrl,
    createdAt: { toMillis: () => new Date(2026, 9, 19).getTime() }, correctionOf: null,
  }], '2026-10-13', '2026-10-19');
  const ExcelJS = require('exceljs'); const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await output.arrayBuffer());
  assert.equal(workbook.worksheets.length, 2);
  assert.equal(workbook.getWorksheet('Stok saat ini').getCell('G3').hyperlink, photoUrl);
  assert.equal(workbook.getWorksheet('Stok saat ini').getCell('H3').value, 'Dihapus');
  assert.equal(workbook.getWorksheet('Riwayat periode').getCell('K3').hyperlink, photoUrl);
  assert.equal(workbook.getWorksheet('Riwayat periode').getCell('J3').value, 'Lantai 2');
  assert.equal(workbook.model.media.length, 0);
  assert(filename.endsWith('.xlsx'));
});

 test('equipment stock, corrections, history and purge remain isolated from materials with the same ID', async () => {
  const f = fixture(); const id = await f.seed();
  await f.service.submitMaterial('diana', f.make('initial', 5, { operationId: id, name: 'Bor', unit: 'unit' }), 'alat');
  const incoming = f.make('incoming', 3, { materialId: id });
  await f.service.submitMaterial('diana', incoming, 'alat');
  await f.service.submitMaterial('diana', f.make('correction', 2, { materialId: id, correctionOf: incoming.operationId }), 'alat');
  assert.equal(f.documents.get('equipmentProjects/diana/materials/' + id).stock, 7);
  assert.match(f.documents.get('equipmentProjects/diana/materials/' + id).photoUrl, /equipment-photos/);
  assert.equal(f.material(id).stock, 100);
  assert.equal((await f.service.fetchMaterials('diana', 'alat'))[0].name, 'Bor');
  assert.equal((await f.service.fetchMaterialMovements('diana', '1970-01-01', '1970-01-02', 'alat')).length, 3);
  await f.service.manageMaterial('diana', { operationId: randomUUID(), materialId: id, action: 'edit', name: 'Bor listrik', unit: 'unit' }, 'alat');
  assert.equal(f.documents.get('equipmentProjects/diana/materials/' + id).name, 'Bor listrik');
  await f.service.manageMaterial('diana', { operationId: randomUUID(), materialId: id, action: 'delete', removeHistory: true, confirmation: 'HAPUS' }, 'alat');
  assert.equal((await f.service.fetchMaterialMovements('diana', '1970-01-01', '1970-01-02', 'alat')).length, 0);
  assert(f.documents.has('materialProjects/diana/movements/' + id));
  assert.equal(f.material(id).isDeleted, undefined);
});
