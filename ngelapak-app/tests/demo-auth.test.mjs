import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import { randomUUID } from "node:crypto";
import ts from "typescript";

function setup() {
  const storage = () => {
    const values = new Map();
    return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  };
  const localStorage = storage();
  const sessionStorage = storage();
  const modules = new Map();
  function load(name) {
    if (modules.has(name)) return modules.get(name);
    const exports = {};
    const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8");
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(code, { exports, require: path => path === "react" ? {} : load(path.replace("./", "")), localStorage, sessionStorage, window: new EventTarget(), Event, crypto: { randomUUID }, Intl, Date });
    modules.set(name, exports);
    return exports;
  }
  return { store: load("demo-store"), types: load("types"), fixtures: load("mock-data"), localStorage };
}

test("guest, tenant, and admin navigation follow role authority", () => {
  const { types } = setup();
  for (const role of [undefined, "penyewa", "admin"]) {
    assert.equal(types.canAccess("verifikasi", role), role === "admin");
    assert.equal(types.canAccess("dasbor", role), role === "admin");
    assert.equal(types.canAccess("pesanan", role), role === "penyewa");
    for (const item of types.navigationFor(role)) assert.equal(types.canAccess(item.id, role), true);
  }
});

test("tenant bookings persist, isolate identities, prevent overlaps, and accept admin decisions", () => {
  const { store, fixtures, localStorage } = setup();
  const input = { spotId: "spot-001", tanggalMulai: store.today(), jumlahHari: 2, jenisUsaha: "Kopi", catatan: "", metodePembayaran: "QRIS" };
  assert.throws(() => store.createDemoBooking(input), /akses/);
  store.demoLogin("admin");
  assert.throws(() => store.createDemoBooking(input), /akses/);
  store.demoLogin("ayu");
  const id = store.createDemoBooking(input);
  const read = () => JSON.parse(localStorage.getItem("ngelapak-demo-bookings-v1"));
  assert.equal(read()[0].id, id);
  assert.equal(read()[0].totalBayar, fixtures.MOCK_SPOTS[0].tarifPerHari * 2);
  assert.equal(read()[0].penyewa.email, store.DEMO_USERS[1].email);
  assert.equal(store.visibleBookings(store.DEMO_USERS[2], read()).some(b => b.id === id), false);
  assert.equal(store.visibleBookings(store.DEMO_USERS[1], read()).some(b => b.id === id), true);
  assert.equal(store.visibleBookings(null, read()).length, 0);
  assert.throws(() => store.verifyDemoBooking(id, "disetujui"), /akses/);
  store.demoLogin("bayu");
  assert.throws(() => store.createDemoBooking(input), /bertabrakan/);
  store.demoLogin("admin");
  store.verifyDemoBooking(id, "ditolak");
  assert.equal(read()[0].statusVerifikasi, "ditolak");
  assert.throws(() => store.verifyDemoBooking(id, "disetujui"), /tidak lagi/);
  store.demoLogin("bayu");
  const replacement = store.createDemoBooking(input);
  store.demoLogin("admin");
  store.verifyDemoBooking(replacement, "disetujui");
  assert.equal(read()[0].status, "aktif");
  store.demoLogout();
  assert.throws(() => store.verifyDemoBooking(replacement, "ditolak"), /akses/);
});

test("invalid dates, durations and unavailable spots fail without creating transactions", () => {
  const { store, localStorage } = setup();
  store.demoLogin("ayu");
  const input = { spotId: "spot-001", tanggalMulai: store.today(), jumlahHari: 1, jenisUsaha: "Kopi", catatan: "", metodePembayaran: "QRIS" };
  for (const patch of [{ tanggalMulai: "" }, { tanggalMulai: "2020-01-01" }, { tanggalMulai: "2099-02-30" }, { jumlahHari: 0 }, { jumlahHari: 31 }, { jumlahHari: 1.5 }, { jenisUsaha: " " }, { spotId: "spot-008" }]) {
    assert.throws(() => store.createDemoBooking({ ...input, ...patch }));
  }
  assert.equal(localStorage.getItem("ngelapak-demo-bookings-v1"), null);
});
