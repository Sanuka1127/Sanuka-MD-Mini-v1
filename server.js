const express = require("express");
const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, delay, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");
const axios = require("axios");
const yts = require("yt-search");
const FormData = require("form-data");

const app = express();
const PORT = process.env.PORT || 3000;

const OWNER_NUMBER = "94781555903";
const FOOTER = "\n\n> 𝕊𝕒𝕟𝕦𝕜𝕒-𝕄𝔻-𝕄𝕚𝕟𝕚-𝕧𝟙 ♾️";
const isOwner = (jid) => jid && jid.includes(OWNER_NUMBER);
if (!fs.existsSync("./auth")) fs.mkdirSync("./auth");

function loadSettings(num) {
  try { return JSON.parse(fs.readFileSync(`./auth/${num}/settings.json`)); }
  catch { return { autostatus: false, alwaysOffline: true, mode: "public", autoview: false }; }
}
function saveSettings(num, data) { fs.writeFileSync(`./auth/${num}/settings.json`, JSON.stringify(data)); }

// PAIR SITE - GOJO WALLPAPER BACKGROUND
app.get("/", (req, res) => {
  res.send(`
  <html><head><title>Sanuka-MD-Mini V1 - Gojo</title><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
  body{margin:0;min-height:100vh;display:flex;justify-content:center;align-items:center;
  background: linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.9)), url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000') center/cover fixed; color:#fff; font-family: sans-serif;}
  .card{background: rgba(15,5,5,0.88); border:1px solid #ff1a1a; border-radius:28px; padding:32px; max-width:400px; width:85%; text-align:center; box-shadow:0 0 60px #ff000055; backdrop-filter: blur(12px);}
  .logo{width:135px;height:135px;border-radius:50%;border:3px solid #ff0000;box-shadow:0 0 35px #ff0000;object-fit:cover;}
  h2{color:#ff3333;text-shadow:0 0 15px #ff0000;margin:12px 0;} .badge{background:#ff0000;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:800;}
  input,button{width:100%;padding:15px;border-radius:14px;margin-top:14px;border:1px solid #ff3333;background:#ffffff12;color:#fff;font-size:15px;box-sizing:border-box;}
  button{background:linear-gradient(90deg,#ff0000,#990000);font-weight:900;cursor:pointer;letter-spacing:1px;} .code{font-size:34px;letter-spacing:6px;color:#ff3333;margin:20px 0;font-weight:900;text-shadow:0 0 12px #ff0000;}
  a{color:#ff5555;font-size:12px;text-decoration:none;} .cmd{font-size:10px;color:#777;margin-top:12px;}
  </style></head><body><div class="card">
  <img class="logo" src="https://i.ibb.co/ZpXyQ0qg/gojo-logo.jpg" onerror="this.src='https://via.placeholder.com/135/000000/ff0000?text=GOJO'">
  <h2>♾️ Sanuka-MD-Mini V1</h2><span class="badge">PUBLIC PAIR - GOJO EDITION</span>
  <p style="font-size:12px;color:#aaa;margin-top:10px">Owner: 94781555903<br>Unlimited Users - Same Link!</p>
  <input id="num" placeholder="947XXXXXXXX (with 94)"><button onclick="getCode()">GET PAIR CODE</button><div id="out"></div>
  <div class="cmd">.menu .yt .tt .ytmovie .ai .sticker .imgtourl .wallpaper</div>
  <a href="https://sanuka1126.github.io/Wallpaper-LK/" target="_blank">🌐 Wallpaper-LK Official</a>
  <p style="margin-top:12px;font-size:11px;color:#ff3333;">> 𝕊𝕒𝕟𝕦𝕜𝕒-𝕄𝔻-𝕄𝕚𝕟𝕚-𝕧𝟙 ♾️</p>
  </div>
  <script>
  async function getCode(){
    let n=document.getElementById('num').value.trim(); if(!n) return alert("Enter number with 94");
    document.getElementById('out').innerHTML="⏳ Generating Pair Code...";
    let r=await fetch('/pair?number='+n); let j=await r.json();
    if(j.code) document.getElementById('out').innerHTML='<div style=margin-top:15px>YOUR CODE:</div><div class=code>'+j.code+'</div><div style=font-size:11px>WhatsApp > Linked Devices > Link with phone number</div>';
    else document.getElementById('out').innerHTML='<div style=color:#ff5a5a;margin-top:12px>'+ (j.error||"Error")+'</div>';
  }
  </script></body></html>`);
});

app.get("/pair", async (req, res) => {
  let number = req.query.number?.replace(/[^0-9]/g, ""); if (!number) return res.json({ error: "Please enter number!" });
  let authPath = `./auth/${number}`; if (!fs.existsSync(authPath)) fs.mkdirSync(authPath, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const sock = makeWASocket({ auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P().child({ level: "fatal" })) }, printQRInTerminal: false, logger: P({ level: "silent" }), browser: Browsers.macOS("Desktop") });
  if (!sock.authState.creds.registered) {
    await delay(2000);
    try { let code = await sock.requestPairingCode(number); res.json({ code }); setTimeout(() => startUserBot(number), 3000); }
    catch (e) { res.json({ error: "Failed: " + e.message }); }
  } else { res.json({ error: "Already Paired! Bot Online ✅" }); startUserBot(number); }
  sock.ev.on("creds.update", saveCreds);
});

async function startUserBot(number) {
  let authPath = `./auth/${number}`;
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const sock = makeWASocket({ auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P().child({ level: "fatal" })) }, logger: P({ level: "silent" }), browser: Browsers.macOS("Desktop") });
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    let m = messages[0]; if (!m.message || m.key.fromMe) return;
    let msg = m.message.conversation || m.message.extendedTextMessage?.text || "";
    let from = m.key.remoteJid; let sender = m.key.participant || from;
    let settings = loadSettings(number);

    if (settings.mode === "private" && !isOwner(sender) && from !== `${OWNER_NUMBER}@s.whatsapp.net`) { if (msg.startsWith(".")) return; }
    if (from === "status@broadcast" && settings.autostatus) { await sock.readMessages([m.key]); return; }
    if (settings.alwaysOffline) await sock.sendPresenceUpdate("unavailable");

    if (msg === ".menu" || msg === ".help") {
      let menu = `♾️ *SANUKA-MD-MINI V1*\n\n👑 Owner: wa.me/94781555903\n🤖 Bot: ${number}\n\n📥 *DOWNLOADER*\n.yt [link]\n.tt [link]\n.ig [link]\n.fb [link]\n.song [name]\n.video [name]\n.ytmovie [name]\n\n👥 *GROUP*\n.kick .add .promote .demote\n.antilink .tagall .hidetag\n.mute .unmute .groupinfo\n\n✨ *TOOLS*\n.ai [query]\n.sticker (reply image)\n.imgtourl (reply image)\n.wallpaper [name]\n\n⚙️ *SETTINGS*\n.setting\n.ping .alive .owner\n\n🌐 Wallpaper: https://sanuka1126.github.io/Wallpaper-LK/${FOOTER}`;
      await sock.sendMessage(from, { text: menu }, { quoted: m });
    }
    if (msg.startsWith(".setting")) {
      let args = msg.split(" "); if (args.length === 1) {
        let txt = `♾️ *SETTINGS*\n\nAutostatus: ${settings.autostatus ? "ON" : "OFF"}\nOffline: ${settings.alwaysOffline ? "ON" : "OFF"}\nMode: ${settings.mode.toUpperCase()}\n\n.setting autostatus on/off\n.setting offline on/off\n.setting mode public/private${FOOTER}`;
        await sock.sendMessage(from, { text: txt }, { quoted: m }); return;
      }
      let opt = args[1]?.toLowerCase(); let val = args[2]?.toLowerCase();
      if (opt === "autostatus") { settings.autostatus = val === "on"; saveSettings(number, settings); await sock.sendMessage(from, { text: `✅ Autostatus: ${val}${FOOTER}` }); }
      if (opt === "offline") { settings.alwaysOffline = val === "on"; saveSettings(number, settings); await sock.sendMessage(from, { text: `✅ Offline: ${val}${FOOTER}` }); }
      if (opt === "mode") { settings.mode = val === "private" ? "private" : "public"; saveSettings(number, settings); await sock.sendMessage(from, { text: `✅ Mode: ${settings.mode}${FOOTER}` }); }
    }
    if (msg.startsWith(".ytmovie ")) {
      let q = msg.replace(".ytmovie ", "").trim() + " full movie"; await sock.sendMessage(from, { text: `🎬 Searching: ${q}...` });
      try { let s = await yts(q); let vids = s.videos.slice(0, 5); let txt = `🎬 *YT MOVIE*\n\n`; vids.forEach((v,i)=>{ txt+=`*${i+1}. ${v.title}*\n${v.timestamp} | ${v.url}\n\n`; }); txt+=FOOTER; await sock.sendMessage(from, { image: { url: vids[0]?.thumbnail }, caption: txt }, { quoted: m }); }
      catch { await sock.sendMessage(from, { text: `❌ Failed${FOOTER}` }, { quoted: m }); }
    }
    if (msg.startsWith(".tt ") || msg.startsWith(".tiktok ")) {
      let url = msg.split(" ")[1]; try { let { data } = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`); await sock.sendMessage(from, { video: { url: data.data.play }, caption: `✅ TikTok${FOOTER}` }, { quoted: m }); }
      catch { await sock.sendMessage(from, { text: `❌ TikTok Failed${FOOTER}` }, { quoted: m }); }
    }
    if (msg === ".imgtourl") {
      let quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage; let media = m.message.imageMessage || quoted;
      if (!media) return await sock.sendMessage(from, { text: `❌ Reply to an image${FOOTER}` }, { quoted: m });
      await sock.sendMessage(from, { text: `🔗 Uploading...` });
      try { let stream = await downloadContentFromMessage(media, "image"); let buffer = Buffer.from([]); for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]); const form = new FormData(); form.append("reqtype", "fileupload"); form.append("fileToUpload", buffer, "img.jpg"); let { data } = await axios.post("https://catbox.moe/user/api.php", form, { headers: form.getHeaders() }); await sock.sendMessage(from, { text: `✅ Image URL:\n${data}${FOOTER}` }, { quoted: m }); }
      catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}${FOOTER}` }, { quoted: m }); }
    }
    if (msg.startsWith(".wallpaper ")) {
      let query = msg.replace(".wallpaper ", "").toLowerCase().trim(); await sock.sendMessage(from, { text: `🖼️ Searching ${query} on Wallpaper-LK...` });
      try { let { data } = await axios.get(`https://sanuka1126.github.io/Wallpaper-LK/api.json`); let results = data.filter(w => w.title.toLowerCase().includes(query)); if (results.length === 0) results = data; let pick = results[Math.floor(Math.random() * results.length)]; await sock.sendMessage(from, { image: { url: pick.url }, caption: `✅ ${pick.title}\n🌐 https://sanuka1126.github.io/Wallpaper-LK/${FOOTER}` }, { quoted: m }); }
      catch { await sock.sendMessage(from, { text: `🌐 Wallpaper-LK: https://sanuka1126.github.io/Wallpaper-LK/${FOOTER}` }, { quoted: m }); }
    }
    if (msg === ".wallpaper") { await sock.sendMessage(from, { text: `🖼️ Usage: .wallpaper [name]\nEx: .wallpaper gojo\n🌐 https://sanuka1126.github.io/Wallpaper-LK/${FOOTER}` }, { quoted: m }); }
    if (msg.startsWith(".ai ")) { let prompt = msg.replace(".ai ", ""); await sock.sendMessage(from, { text: `🤖 Thinking...` }); try { let { data } = await axios.get(`https://api.voids.top/ai?q=${encodeURIComponent(prompt)}`); await sock.sendMessage(from, { text: `${data.result || "No answer"}${FOOTER}` }, { quoted: m }); } catch { await sock.sendMessage(from, { text: `❌ AI offline${FOOTER}` }, { quoted: m }); } }
    if (msg === ".ping") { await sock.sendMessage(from, { text: `🏓 Pong! ${FOOTER}` }, { quoted: m }); }
    if (msg === ".alive") { await sock.sendMessage(from, { text: `♾️ Sanuka-MD-Mini V1 Alive!\nOwner: 94781555903\nWallpaper-LK: OK${FOOTER}` }, { quoted: m }); }
    if (msg === ".owner") { await sock.sendMessage(from, { text: `👑 Owner: wa.me/94781555903\nBot: 𝕊𝕒𝕟𝕦𝕜𝕒-𝕄𝔻-𝕄𝕚𝕟𝕚-𝕧𝟙\nSite: https://sanuka1126.github.io/Wallpaper-LK/${FOOTER}` }, { quoted: m }); }
    if (msg === ".tagall" && from.endsWith("@g.us")) { let meta = await sock.groupMetadata(from); let mems = meta.participants.map(p=>p.id); await sock.sendMessage(from, { text: `📢 Tag All${FOOTER}\n${mems.map(a=>`@${a.split("@")[0]}`).join(" ")}`, mentions: mems }); }
  });
}

try { fs.readdirSync("./auth").forEach(n => { if (fs.statSync(`./auth/${n}`).isDirectory()) startUserBot(n); }); } catch {}
app.listen(PORT, () => console.log(`Sanuka-MD-Mini V1 Running on ${PORT}`));
