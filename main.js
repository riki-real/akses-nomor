// Token GitHub dihapus. Gunakan backend (/api/submit) untuk akses aman.
    const passwordAdmin = "admin123";
    let jsonData = null;
    let fileSha = null;
    let isAdmin = false;function showStatus(message, type = 'success') {
  const el = isAdmin ? document.getElementById("statusAdmin") : document.getElementById("status");
  const sound = document.getElementById("notifSound");

  // Ganti suara berdasarkan status
  if (type === 'success') {
    sound.src = "benar.mp3"; // suara ting
  } else {
    sound.src = "salah.mp3"; // suara detdot
  }

  el.innerText = message;
  el.className = `status ${type}`;
  el.classList.remove("hidden");
  el.style.opacity = 1;
  sound.currentTime = 0;
  sound.play();
  setTimeout(() => {
    el.style.opacity = 0;
    setTimeout(() => el.classList.add("hidden"), 500);
  }, 3000);
}

function togglePanduan() {
  document.getElementById("panduanBox").classList.toggle("hidden");
}

function toggleDaftarNomor() {
  const area = document.getElementById("listUserArea");
  area.classList.toggle("hidden");
  if (!area.classList.contains("hidden")) {
    lihatPenggunaUmum();
  }
}

async function hapusDariBlacklist() {
  const nomor = document.getElementById("blacklistSelect").value;
  if (!nomor) return showStatus("Pilih nomor dari blacklist.", "warning");

  await ambilData();
  const index = jsonData.blacklist.indexOf(nomor);
  if (index > -1) {
    jsonData.blacklist.splice(index, 1);
    const berhasil = await simpanData(`Hapus dari blacklist: ${nomor}`);
    if (berhasil) {
      showStatus("Nomor dihapus dari blacklist.", "success");
      updateBlacklistArea();
    } else {
      showStatus("Gagal menghapus blacklist.", "warning");
    }
  }
}

function toggleBlacklist() {
  const box = document.getElementById("blacklistBox");
  box.classList.toggle("hidden");
  if (!box.classList.contains("hidden")) {
    updateBlacklistArea();
  }
}

function updateBlacklistArea() {
  const area = document.getElementById("blacklistArea");
  if (!jsonData || !jsonData.blacklist || jsonData.blacklist.length === 0) {
    area.value = "Tidak ada nomor blacklist.";
    return;
  }
  area.value = jsonData.blacklist.map((nomor, i) => `${i + 1}. ${nomor}`).join("\n");
}

function updateClock() {
  const clock = document.getElementById("clock");
  const now = new Date();
  const waktu = now.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const tanggal = now.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" });
  clock.innerText = `\u23F0 Waktu sekarang: ${tanggal} ${waktu}`;
}
setInterval(updateClock, 1000);
updateClock();

async function ambilData() {
  try {
    const res = await fetch("/api/submit");
    if (!res.ok) throw new Error("Gagal ambil data");
    const data = await res.json();
    fileSha = data.sha;
    jsonData = data.content;
  } catch (e) {
    console.error(e);
    alert("Gagal ambil data dari server.");
  }
  }
async function simpanData(message) {
  const updatedContent = JSON.stringify(jsonData, null, 2);
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      content: updatedContent,
      sha: fileSha
    })
  });
  return res.ok;
}

function updateUserListForUser() {
  const area = document.getElementById("listUserArea");
  if (!jsonData || !jsonData.users) return;
  area.value = jsonData.users.map((u, i) => {
    const isBL = jsonData.blacklist?.includes(u.nomor);
    const status = isBL ? 'BLACKLIST' : 'AKTIF';
    return `${i + 1}. ${u.nomor} | ${status} | ${u.waktu || '-'}`;
  }).join("\n");
}

function tampilkanDataUserSendiri() {
  const data = JSON.parse(localStorage.getItem("userData"));
  const userArea = document.getElementById("userPrivate");
  if (data) {
    userArea.value = `Nomor: ${data.nomor}\nPassword: ${data.password}`;
  } else {
    userArea.value = "Belum ada data disimpan.";
  }
}

async function tambahNomor() {
  const nomor = document.getElementById("nomor").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!nomor || !password) return showStatus("Nomor dan password wajib diisi.", "warning");
  if (!/^\+?\d{8,15}$/.test(nomor)) return showStatus("Nomor tidak valid.", "warning");

  await ambilData();

  if (jsonData.blacklist?.includes(nomor)) {
    return showStatus("Nomor ini diblacklist.", "warning");
  }

  // Cek apakah nomor sudah ada
  const sudahAda = jsonData.users.some(user => user.nomor === nomor);
  if (sudahAda) {
    return showStatus("Nomor sudah terdaftar.", "warning");
  }

  const waktu = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  jsonData.users.push({ nomor, password, waktu });
  const berhasil = await simpanData(`Tambah nomor ${nomor}`);
  if (berhasil) {
    localStorage.setItem("userData", JSON.stringify({ nomor, password }));
    tampilkanDataUserSendiri();
    document.getElementById("nomor").value = "";
    document.getElementById("password").value = "";
    showStatus("Berhasil menambahkan.", "success");
    updateUserListForUser();
  } else {
    showStatus("Gagal menambahkan.", "warning");
  }
}

async function lihatPenggunaUmum() {
  await ambilData();
  updateUserListForUser();
}

async function adminLogin() {
  const pass = document.getElementById("adminPass").value;
  if (pass === passwordAdmin) {
    isAdmin = true;
    document.getElementById("mainForm").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
    await ambilData();
    updateOutputList();
    updateSelectOptions();
  } else {
    showStatus("Password salah.", "warning");
  }
}

async function kembali(forceUpdate = false) {
  isAdmin = false;
  document.getElementById("mainForm").classList.remove("hidden");
  document.getElementById("adminPanel").classList.add("hidden");
  if (forceUpdate) {
    await ambilData();
    updateUserListForUser();
  }
}

function updateOutputList() {
  const output = document.getElementById("outputArea");
  if (!jsonData || !jsonData.users) return;
  output.value = jsonData.users.map((u, i) => {
    const isBL = jsonData.blacklist?.includes(u.nomor);
    const status = isBL ? 'BLACKLIST' : 'AKTIF';
    return `${i + 1}. ${u.nomor} | ${u.password} | ${u.waktu || '-'} | ${status}`;
  }).join("\n");
}

function updateSelectOptions() {
  const select = document.getElementById("nomorSelect");
  select.innerHTML = '<option value="">Pilih nomor...</option>';
  jsonData.users.forEach((u, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.text = `${i + 1}. ${u.nomor}${jsonData.blacklist?.includes(u.nomor) ? ' (BLACKLIST)' : ''}`;
    select.appendChild(option);
  });
}

async function hapusNomor() {
  const index = parseInt(document.getElementById("nomorSelect").value);
  if (isNaN(index)) return showStatus("Pilih nomor.", "warning");
  await ambilData();

  const userToDelete = jsonData.users[index];
  const nomorHapus = userToDelete.nomor;
  const passwordHapus = userToDelete.password;

  // Hapus dari localStorage jika cocok
  const localData = JSON.parse(localStorage.getItem("userData"));
  if (localData && localData.nomor === nomorHapus && localData.password === passwordHapus) {
    localStorage.removeItem("userData");
    tampilkanDataUserSendiri();
  }

  jsonData.users.splice(index, 1);
  const berhasil = await simpanData(`Hapus nomor ${nomorHapus}`);
  if (berhasil) {
    updateOutputList();
    updateSelectOptions();
    showStatus("Berhasil dihapus.", "success");
  } else {
    showStatus("Gagal menghapus.", "warning");
  }
}

function updateBlacklistArea() {
  const area = document.getElementById("blacklistArea");
  const select = document.getElementById("blacklistSelect");

  if (!jsonData || !jsonData.blacklist || jsonData.blacklist.length === 0) {
    area.value = "Tidak ada nomor blacklist.";
    select.innerHTML = '<option value="">Tidak ada nomor</option>';
    return;
  }

  area.value = jsonData.blacklist.map((nomor, i) => `${i + 1}. ${nomor}`).join("\n");

  // Update dropdown
  select.innerHTML = '<option value="">Pilih nomor...</option>';
  jsonData.blacklist.forEach((nomor, i) => {
    const opt = document.createElement("option");
    opt.value = nomor;
    opt.text = `${i + 1}. ${nomor}`;
    select.appendChild(opt);
  });
}

async function blacklistNomor() {
  const index = parseInt(document.getElementById("nomorSelect").value);
  if (isNaN(index)) return showStatus("Pilih nomor.", "warning");
  await ambilData();
  const nomor = jsonData.users[index].nomor;
  jsonData.users.splice(index, 1);
  jsonData.blacklist = jsonData.blacklist || [];
  if (!jsonData.blacklist.includes(nomor)) {
    jsonData.blacklist.push(nomor);
  }
  const berhasil = await simpanData(`Blacklist nomor ${nomor}`);
  if (berhasil) {
    updateOutputList();
    updateSelectOptions();
    showStatus("Nomor diblacklist.", "success");
  } else {
    showStatus("Gagal blacklist.", "warning");
  }
}

updateBlacklistArea(); // tambahkan ini
updateOutputList();
updateSelectOptions();
tampilkanDataUserSendiri();
ambilData();
