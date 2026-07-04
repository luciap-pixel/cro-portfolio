"""
download-images.py  —  fetches Konk's real product images + logo into ./images/
Run once from your project folder:   python download-images.py
Uses only the Python standard library (no pip install needed).
These are Konk's own assets, used unchanged for the redesign concept.
"""
import os, ssl, urllib.request

ASSETS = {
    "logo.png": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/5629b2d9-7bbe-46d9-9d41-a82623707f57/Logo-Konk-dot%282023%29.png?format=500w",
    "signature_oak.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1651132045811-J7X3GSKP4TJ63BYXBSCN/SIGNATURE%27+DINING+TABLE+%5BOAK%5D+1.jpg?format=1200w",
    "signature_walnut.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1648718099624-0HK51UOWJ0R1WAJO0A9Z/SIGNATURE%27+DINING+TABLE++%5BWALNUT%5D+3.jpg?format=1200w",
    "refectory.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1579176444813-GJN91COZRUHIJRWB3N13/Refrectory-Table-Walnut-web-01crop.jpg?format=1000w",
    "kross.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1721292950094-MH8E8R7OOWS180C87S4U/Kross+Kitchen+Table+%5BMix%5D+1.jpg?format=1000w",
    "sage.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1551198595800-693620KVU1GBL10FB2U8/Wooden-Sage-Table-thumb.jpg?format=1000w",
    "yuki_desk.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1697464441960-A7S7PF7TPB1J5NCJ4W9S/Yuki+Desk+%5BWalnut%5D+7.jpg?format=1000w",
    "talja_desk.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1572534766541-A5SXXBSEYOHSGIBQV0K8/Gauged-Front-Desk-01-web.jpg?format=1000w",
    "chamfered_media.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1688996727290-3E72ZZYH5Q9H8G19FM3Q/r908+2.jpg?format=1000w",
    "kobi.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1702547567688-H1OTLOIT50167ZC8YNU2/_Kobi_+Sideboard+2.jpg?format=1000w",
    "yackt_sideboard.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1689237090536-MDPCKA65HYG90AXIDDHF/Yackt+Cabinet.jpg?format=1000w",
    "oku.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1572611278973-X8HE5APRNHVN809J2F9B/Oku-01-web.jpg?format=1000w",
    "overhang.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1670500283786-DVPJTSEY7GE77F7GTDBK/_OVERHANG_+SHELVING+%5BWOODEN%5D+4.jpg?format=1000w",
    "yackt_chair.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1579175214315-9MF6SWKNFU6K5RWGD84Y/Yackt-Chair-Web-01.jpg?format=800w",
    "sakt_bench.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1676304652731-NZYNZTZQGNLMT2KGMHNG/Sakt+Bench+1.jpg?format=1000w",
    "haukotus_bed.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1575381454408-VEBL558R0OY7I1HDMVXX/Konk-Bed-web-03.jpg?format=1000w",
    "yume_daybed.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1f3db8b2-ca50-422c-89b6-3b89a6f485f0/Yume+Daybed+RTS+7.jpg?format=1000w",
    "som_table.jpg": "https://images.squarespace-cdn.com/content/v1/54caa8a8e4b079753b1fb11d/1701345090345-8E7TAGD1DECTLNBW0MSO/S%C3%B8m+Table+1.jpg?format=1200w",
}

def main():
    os.makedirs("images", exist_ok=True)
    ctx = ssl.create_default_context()
    headers = {"User-Agent": "Mozilla/5.0"}
    ok = 0
    for name, url in ASSETS.items():
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
                data = r.read()
            with open(os.path.join("images", name), "wb") as f:
                f.write(data)
            print(f"  ok   {name}  ({len(data):,} bytes)")
            ok += 1
        except Exception as e:
            print(f"  FAIL {name}  {e}")
    print(f"\nDone: {ok}/{len(ASSETS)} assets saved to ./images/")
    if ok != len(ASSETS):
        print("Some downloads failed — re-run, or grab those images manually from konkfurniture.com")

if __name__ == "__main__":
    main()
