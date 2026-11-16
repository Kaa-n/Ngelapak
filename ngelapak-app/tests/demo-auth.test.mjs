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

test("Midtrans demo confirms payment and releases a date on cancellation approval before recording refund", () => {
  const { store, localStorage } = setup();
  const read = (id) => JSON.parse(localStorage.getItem("ngelapak-demo-bookings-v1")).find(booking => booking.id === id);
  const date = new Date(Date.parse(store.today() + "T00:00:00Z") + 10 * 86400000).toISOString().slice(0, 10);
  const start = Date.parse(date + "T08:00:00+08:00");
  const input = { spotId: "spot-001", tanggalMulai: date, jumlahHari: 1, jenisUsaha: "Kopi", catatan: "", metodePembayaran: "midtrans" };
  const form = { nama: "Ayu", nim: "220000001", telepon: "08123456789", bank: "Bank Demo", nomorRekening: "123456789", namaRekening: "Ayu", alasan: "Perubahan jadwal" };

  store.demoLogin("ayu");
  const id = store.createDemoBooking(input);
  assert.equal(Date.parse(read(id).paymentExpiresAt) - Date.parse(read(id).createdAt), 3600000);
  assert.equal(store.canCancelBooking(read(id)), false);
  store.demoLogin("bayu");
  assert.throws(() => store.completeDemoPayment(id), /tidak tersedia/);
  store.demoLogin("ayu");
  store.completeDemoPayment(id);
  const paid = read(id);
  assert.equal(paid.status, "aktif");
  const h1 = { ...paid, paidAt: new Date(start - 25 * 3600000).toISOString() };
  assert.equal(store.canCancelBooking(h1, start - 24 * 3600000), true);
  assert.equal(store.canCancelBooking(h1, start - 24 * 3600000 + 1), false);
  const nightBefore = { ...paid, paidAt: new Date(start - (8 * 60 + 1) * 60000).toISOString() };
  assert.equal(store.canCancelBooking(nightBefore, Date.parse(nightBefore.paidAt)), false);

  store.cancelDemoBooking(id, form);
  store.demoLogin("bayu");
  assert.throws(() => store.createDemoBooking(input), /bertabrakan/);
  store.demoLogin("admin");
  store.reviewDemoCancellation(id, "disetujui");
  assert.equal(read(id).status, "dibatalkan");
  assert.equal(read(id).pembatalan.refundCompleted, false);
  store.demoLogin("bayu");
  assert.ok(store.createDemoBooking(input));
  store.demoLogin("admin");
  store.reviewDemoCancellation(id, "refund");
  assert.equal(read(id).pembatalan.refundCompleted, true);
});

const futureDate = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

test("tenant bookings persist, isolate identities, prevent overlaps, and accept admin decisions", () => {
  const { store, fixtures, localStorage } = setup();
  const input = { spotId: "spot-001", tanggalMulai: futureDate(90), jumlahHari: 2, jenisUsaha: "Kopi", catatan: "", metodePembayaran: "QRIS" };
  assert.throws(() => store.createDemoBooking(input), /akses/);
  store.demoLogin("admin");
  assert.throws(() => store.createDemoBooking(input), /akses/);
  store.demoLogin("ayu");
  const id = store.createDemoBooking(input);
  const read = () => JSON.parse(localStorage.getItem("ngelapak-demo-bookings-v1"));
  assert.equal(read()[0].id, id);
  assert.equal(read()[0].status, "menunggu");
  assert.equal(read()[0].statusVerifikasi, "menunggu");
  assert.equal(store.canCancelBooking(read()[0]), true);
  assert.equal(read()[0].totalBayar, fixtures.MOCK_SPOTS[0].tarifPerHari * 2);
  assert.equal(read()[0].penyewa.email, store.DEMO_USERS[1].email);
  assert.equal(store.visibleBookings(store.DEMO_USERS[2], read()).some(b => b.id === id), false);
  assert.equal(store.visibleBookings(store.DEMO_USERS[1], read()).some(b => b.id === id), true);
  assert.equal(store.visibleBookings(null, read()).length, 0);
  assert.throws(() => store.verifyDemoBooking(id, "disetujui"), /akses/);
  store.demoLogin("bayu");
  assert.throws(() => store.createDemoBooking(input), /bertabrakan/);
  assert.throws(() => store.createDemoBooking({ ...input, tanggalMulai: futureDate(94) }), /bertabrakan/);
  assert.ok(store.createDemoBooking({ ...input, tanggalMulai: futureDate(95) }));
  store.demoLogin("admin");
  store.verifyDemoBooking(id, "ditolak");
  assert.equal(read().find((booking) => booking.id === id).statusVerifikasi, "ditolak");
  assert.equal(read().find((booking) => booking.id === id).status, "dibatalkan");
  assert.throws(() => store.verifyDemoBooking(id, "disetujui"), /tidak lagi/);
  store.demoLogin("bayu");
  const replacement = store.createDemoBooking(input);
  assert.equal(read()[0].id, replacement);
  assert.equal(read()[0].status, "menunggu");
  assert.equal(read()[0].statusVerifikasi, "menunggu");
  store.demoLogout();
  assert.throws(() => store.verifyDemoBooking(replacement, "ditolak"), /akses/);
});

test("tenant can cancel within 24 hours before admin verification", () => {
  const { store, localStorage } = setup();
  store.demoLogin("ayu");
  const input = { spotId: "spot-001", tanggalMulai: futureDate(90), jumlahHari: 1, jenisUsaha: "Kopi", catatan: "", metodePembayaran: "QRIS" };
  const id = store.createDemoBooking(input);
  const read = () => JSON.parse(localStorage.getItem("ngelapak-demo-bookings-v1"));
  const form = { nama: "Ayu", nim: "2105551001", telepon: "081234", bank: "BRI", nomorRekening: "1234567890", namaRekening: "Ayu", alasan: "Jadwal bentrok kuliah" };
  store.demoLogin("bayu");
  assert.throws(() => store.cancelDemoBooking(id, form), /milik/);
  store.demoLogin("ayu");
  assert.throws(() => store.cancelDemoBooking(id, { ...form, nama: " " }), /Lengkapi/);
  store.cancelDemoBooking(id, form);
  assert.equal(read()[0].status, "dibatalkan");
  assert.equal(read()[0].pembatalan.nomorRekening, "1234567890");
  assert.equal(store.canCancelBooking(read()[0]), false);
  store.demoLogin("admin");
  assert.throws(() => store.verifyDemoBooking(id, "disetujui"), /tidak lagi/);
  store.demoLogin("ayu");
  const again = store.createDemoBooking({ ...input, spotId: "spot-002" });
  const rows = read();
  rows.find((item) => item.id === again).createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  localStorage.setItem("ngelapak-demo-bookings-v1", JSON.stringify(rows));
  assert.equal(store.canCancelBooking(read().find((item) => item.id === again)), false);
  assert.throws(() => store.cancelDemoBooking(again, form), /1x24/);
});

test("product caption is one text saved by the tenant", () => {
  const { store } = setup();
  assert.equal(store.readProductCaption("spot-003"), "");
  assert.throws(() => store.saveProductCaption("spot-003", "Kopi susu"), /penyewa/);
  store.demoLogin("ayu");
  assert.throws(() => store.saveProductCaption("spot-003", "Kopi susu"), /lunas/);
  store.saveProductCaption("spot-001", "  Kopi susu  ");
  assert.equal(store.readProductCaption("spot-001"), "Kopi susu");
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
