
const { Octokit } = require("@octokit/rest");

module.exports = async (req, res) => {
  const token = process.env.GITHUB_TOKEN;
  const repo = "add-nomor";
  const owner = "web-payment";
  const path = "code.json";

  if (!token) {
    console.error("GITHUB_TOKEN tidak ditemukan!");
    return res.status(500).json({ error: "Token GitHub tidak tersedia di environment." });
  }

  console.log("GITHUB_TOKEN ditemukan:", token.substring(0, 5) + "***");

  const octokit = new Octokit({ auth: token });

  // GET: Ambil data
  if (req.method === "GET") {
    try {
      const { data: fileData } = await octokit.repos.getContent({ owner, repo, path });
      const content = Buffer.from(fileData.content, "base64").toString();
      const json = JSON.parse(content);
      return res.status(200).json({ content: json, sha: fileData.sha });
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      return res.status(500).json({ error: "Gagal mengambil data" });
    }
  }

  // POST: Simpan data
  if (req.method === "POST") {
  const { nomor, password } = req.body;

  if (!nomor || !password) {
    return res.status(400).json({ error: "Nomor atau password kosong" });
  }

  try {
    const fileData = await octokit.repos.getContent({ owner, repo, path });
    const sha = fileData.data.sha;
    const content = Buffer.from(fileData.data.content, "base64").toString("utf8");
    const json = JSON.parse(content);

    // Cek apakah nomor sudah ada
    const exists = json.users.find((u) => u.nomor === nomor);
    if (exists) {
      return res.status(400).json({ error: "Nomor sudah terdaftar" });
    }

    // Tambahkan data baru
    json.users.push({
      nomor,
      password,
      waktu: new Date().toISOString()
    });

    const newContent = Buffer.from(JSON.stringify(json, null, 2)).toString("base64");

    const result = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Tambah nomor ${nomor}`,
      content: newContent,
      sha
    });

    return res.status(200).json({ success: true, result });

  } catch (err) {
    console.error("Gagal menyimpan data:", err);
    return res.status(500).json({ error: "Gagal menyimpan data" });
  }
}

  res.status(405).json({ error: "Method tidak diizinkan" });
};
