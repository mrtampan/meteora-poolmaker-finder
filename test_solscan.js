async function test() {
  const url = "https://api-v2.solscan.io/v2/account/transaction?address=xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a&page=1&page_size=10&sort_by=block_time&sort_order=asc";
  try {
    const r = await fetch(url, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "referer": "https://solscan.io/",
        "origin": "https://solscan.io",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    });
    console.log("Status:", r.status);
    const text = await r.text();
    console.log("Result:", text.slice(0, 300));
  } catch (err) {
    console.error(err);
  }
}
test();

