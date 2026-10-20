/* Balkar Otomotiv — site betiği. Bağımlılık yok.
   Metinler sayfaya gömülü window.T içinden gelir (4 dil olustur.py tarafından üretilir). */
(function () {
  "use strict";
  var T = window.T || {}, DIL = window.DIL || "tr", AYAR = window.AYAR || {};
  var VERI = window.ARACLAR || { araclar: [] };
  var ARACLAR = (VERI.araclar || []).filter(function (a) { return a && a.durum !== "satildi"; });
  var YEREL = { tr: "tr-TR", en: "en-GB", ru: "ru-RU", de: "de-DE" }[DIL] || "tr-TR";

  function t(k, vars) {
    var s = T[k];
    if (s == null) { return k; }
    if (vars) { Object.keys(vars).forEach(function (v) { s = s.split("{" + v + "}").join(vars[v]); }); }
    return s;
  }
  function $(s, k) { return (k || document).querySelector(s); }
  function $$(s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); }
  function kacis(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function sayi(n) { return new Intl.NumberFormat(YEREL, { maximumFractionDigits: 0 }).format(n); }
  function para(n) { return sayi(Math.round(n)) + " TL"; }
  function ikon(ad) { return '<svg aria-hidden="true"><use href="#i-' + ad + '"/></svg>'; }
  function wa(metin) { return "https://wa.me/" + AYAR.whatsapp + "?text=" + encodeURIComponent(metin); }
  function anahtar(s) {
    return String(s || "").toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  }
  function ceviriVeyaHam(onek, deger) {
    if (!deger) { return ""; }
    var k = "arac." + onek + "_" + anahtar(deger);
    return T[k] != null ? T[k] : deger;
  }

  /* ---------------- araç yardımcıları */
  function seriAdi(a) {
    var m = /^(.+?) Serisi$/.exec(a.seri || "");
    if (!m || DIL === "tr") { return a.seri || ""; }
    var x = m[1], mercedes = /mercedes/i.test(a.marka || ""), bmw = /bmw/i.test(a.marka || "");
    if (mercedes) { return { en: x + "-Class", ru: x + "-класс", de: x + "-Klasse" }[DIL]; }
    return { en: x + " Series", ru: x + " серии", de: bmw ? x + "er" : x + "-Serie" }[DIL];
  }
  function aracAdi(a) { return [a.marka, seriAdi(a)].filter(Boolean).join(" "); }
  function yilGecerli(v) { var y = Number(v); return /^\d{4}$/.test(String(v)) && y >= 1900 && y <= new Date().getFullYear() + 1; }
  function aracTamAd(a) { return [a.yil, a.marka, seriAdi(a), a.model].filter(Boolean).join(" "); }
  function aracLink(a) { return "arac.html?id=" + encodeURIComponent(a.id); }
  function yeniMi(a) {
    if (!a.ilan_tarihi || !VERI.guncelleme) { return false; }
    return (new Date(VERI.guncelleme) - new Date(a.ilan_tarihi)) / 864e5 <= 3;
  }
  function temizMi(a) {
    var h = a.hasar; return !!h && !h.degisen && !h.boya && !h.lokal && !h.agir_hasar;
  }
  function buyukFoto(u) { return String(u).replace("/x5_", "/x16_"); }
  function cokDilli(v) { if (!v) { return ""; } if (typeof v === "string") { return v; } return v[DIL] || v.tr || ""; }
  function fotoHTML(a, buyuk) {
    var f = (a.fotograflar || [])[0];
    var yok = '<div class="foto-yok">' + ikon("araba") + '<span>' + kacis(t("arac.foto_yok")) + "</span></div>";
    if (!f) { return yok; }
    return yok + '<img src="' + kacis(f) + '" alt="' + kacis(aracTamAd(a)) + '" loading="' + (buyuk ? "eager" : "lazy") + '" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">';
  }
  function kartHTML(a) {
    var oz = [];
    if (a.km != null) { oz.push("<li>" + ikon("gosterge") + sayi(a.km) + " km</li>"); }
    if (a.yakit) { oz.push("<li>" + ikon("yakit") + kacis(t("arac.yakit_" + a.yakit)) + "</li>"); }
    if (a.vites) { oz.push("<li>" + ikon("vites") + kacis(t("arac.vites_" + a.vites)) + "</li>"); }
    return '<a class="arac-kart" href="' + aracLink(a) + '">' +
      '<div class="foto">' + fotoHTML(a) + '<span class="arac-yil">' + kacis(a.yil) + "</span>" +
      (yeniMi(a) ? '<span class="arac-yeni">' + kacis(t("arac.yeni")) + "</span>" : "") +
      (temizMi(a) ? '<span class="arac-temiz">' + kacis(t("arac.hatasiz")) + "</span>" : "") + "</div>" +
      '<div class="arac-govde"><h3 class="arac-baslik">' + kacis(aracAdi(a)) + "</h3>" +
      '<p class="arac-model">' + kacis(a.model || "") + "</p>" +
      '<p class="arac-fiyat">' + (a.fiyat ? para(a.fiyat) : "") + "</p>" +
      '<ul class="arac-ozellik">' + oz.join("") + "</ul></div></a>";
  }
  function sirala(liste, sira) {
    var k = liste.slice();
    var f = {
      yeni: function (a, b) { return String(b.ilan_tarihi || "").localeCompare(String(a.ilan_tarihi || "")); },
      fiyat_artan: function (a, b) { return (a.fiyat || 0) - (b.fiyat || 0); },
      fiyat_azalan: function (a, b) { return (b.fiyat || 0) - (a.fiyat || 0); },
      km: function (a, b) { return (a.km || 0) - (b.km || 0); },
      yil: function (a, b) { return (b.yil || 0) - (a.yil || 0); }
    }[sira] || function () { return 0; };
    return k.sort(f);
  }
  function markaSecicileri() {
    var markalar = {};
    ARACLAR.forEach(function (a) { if (a.marka) { markalar[a.marka] = (markalar[a.marka] || 0) + 1; } });
    $$("[data-marka-secici]").forEach(function (s) {
      Object.keys(markalar).sort(function (a, b) { return a.localeCompare(b, "tr"); }).forEach(function (m) {
        var o = document.createElement("option"); o.value = m; o.textContent = m + " (" + markalar[m] + ")"; s.appendChild(o);
      });
    });
    /* model yılı serbest yazılır (liste yok: yıllar geçince güncelleme gerekmez, eski araçlar da girilebilir); yalnızca rakam kabul edilir */
    $$("[data-yil-alan]").forEach(function (el) {
      el.addEventListener("input", function () { var v = el.value.replace(/\D/g, "").slice(0, 4); if (v !== el.value) { el.value = v; } });
    });
  }

  /* ---------------- genel arayüz */
  function arayuz() {
    var menuBtn = $(".menu-btn");
    if (menuBtn) {
      menuBtn.addEventListener("click", function () {
        var acik = document.body.classList.toggle("menu-acik");
        menuBtn.setAttribute("aria-expanded", acik);
        menuBtn.setAttribute("aria-label", acik ? menuBtn.dataset.kapat : menuBtn.dataset.ac);
      });
    }
    var dil = $("[data-dil]");
    if (dil) {
      var btn = $(".dil-btn", dil);
      btn.addEventListener("click", function (e) { e.stopPropagation(); var a = dil.classList.toggle("acik"); btn.setAttribute("aria-expanded", a); });
      document.addEventListener("click", function () { dil.classList.remove("acik"); btn.setAttribute("aria-expanded", "false"); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") { dil.classList.remove("acik"); document.body.classList.remove("menu-acik"); } });
    }
    // dil değiştirirken sorgu (araç id, filtre) korunur ve seçim hatırlanır
    $$("[data-dil-link]").forEach(function (a) {
      a.addEventListener("click", function () {
        try { localStorage.setItem("balkar_dil", a.getAttribute("hreflang")); } catch (e) {}
        a.href = a.getAttribute("href").split("?")[0] + location.search + location.hash;
      });
    });
    $$("[data-wa]").forEach(function (a) { a.href = wa(t("ortak.wa_genel_mesaj")); a.target = "_blank"; a.rel = "noopener"; });
    $$("[data-arac-sayisi]").forEach(function (b) { b.textContent = ARACLAR.length; });

    $$("[data-kaydir]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = $("[data-kaydirici]", b.closest("section"));
        if (k) { k.scrollBy({ left: Number(b.dataset.kaydir) * (k.clientWidth * 0.85), behavior: "smooth" }); }
      });
    });
  }

  /* ---------------- anasayfa */
  function anasayfa() {
    var v = $("[data-vitrin]");
    if (v) {
      v.innerHTML = sirala(ARACLAR, "yeni").slice(0, Number(v.dataset.vitrin) || 6).map(kartHTML).join("");
    }
    var oc = $("[data-one-cikan]");
    if (oc && ARACLAR.length) {
      var a = ARACLAR.filter(function (x) { return x.one_cikan; })[0] || sirala(ARACLAR, "yeni")[0];
      /* köşe yazısı panelden seçilir: yeni | one_cikan | ozel (panelde yazılan, 4 dil) | "" (yazı yok); alan yoksa "Yeni eklendi" */
      var tur = a.one_cikan_etiket == null ? "yeni" : a.one_cikan_etiket;
      var etiket = tur === "yeni" ? t("arac.yeni") : tur === "one_cikan" ? t("arac.one_cikan") : tur === "ozel" ? cokDilli(a.one_cikan_ozel) : "";
      oc.innerHTML = '<a class="one-cikan" href="' + aracLink(a) + '"><div class="foto">' + fotoHTML(a, true) + "</div>" +
        (etiket ? '<span class="one-cikan-etiket">' + kacis(etiket) + "</span>" : "") +
        '<div class="one-cikan-bilgi"><div><h2>' + kacis(aracAdi(a)) + "</h2><p>" + kacis([a.yil, a.model, a.km != null ? sayi(a.km) + " km" : ""].filter(Boolean).join(", ")) + "</p></div>" +
        '<span class="one-cikan-fiyat">' + para(a.fiyat) + "</span></div></a>";
    }
  }

  /* ---------------- araç listesi */
  function liste() {
    var kutu = $("[data-liste]");
    if (!kutu) { return; }
    var form = $("[data-filtre-form]"), sira = $("[data-sira]"), filtre = $("#filtre");
    var p = new URLSearchParams(location.search);
    ["q", "kategori", "marka", "yakit", "vites", "yil", "fiyat", "km"].forEach(function (k) { if (p.get(k) && form.elements[k]) { form.elements[k].value = p.get(k); } });
    if (p.get("sira")) { sira.value = p.get("sira"); }

    function uygula() {
      var f = {};
      ["q", "kategori", "marka", "yakit", "vites", "yil", "fiyat", "km"].forEach(function (k) { f[k] = (form.elements[k].value || "").trim(); });
      var q = anahtar(f.q);
      var sonuc = ARACLAR.filter(function (a) {
        if (f.kategori && a.kategori !== f.kategori) { return false; }
        if (f.marka && a.marka !== f.marka) { return false; }
        if (f.yakit && a.yakit !== f.yakit) { return false; }
        if (f.vites && a.vites !== f.vites) { return false; }
        if (f.yil.length === 4 && (a.yil || 0) < Number(f.yil)) { return false; }
        if (f.fiyat && (a.fiyat || 0) > Number(f.fiyat)) { return false; }
        if (f.km && (a.km || 0) > Number(f.km)) { return false; }
        if (q) {
          var metin = anahtar([a.marka, a.seri, a.model, a.yil, a.renk, a.baslik].join(" "));
          if (q.split("_").some(function (parca) { return metin.indexOf(parca) < 0; })) { return false; }
        }
        return true;
      });
      sonuc = sirala(sonuc, sira.value);
      kutu.innerHTML = sonuc.map(kartHTML).join("");
      $("[data-sonuc-sayi]").textContent = t("arac.sonuc_sayisi", { n: sonuc.length });
      $("[data-bos]").hidden = sonuc.length > 0;
      var aktif = Object.keys(f).filter(function (k) { return f[k]; }).length;
      var rozet = $("[data-filtre-sayi]"); rozet.hidden = !aktif; rozet.textContent = aktif;
      var u = new URLSearchParams();
      Object.keys(f).forEach(function (k) { if (f[k]) { u.set(k, f[k]); } });
      if (sira.value !== "yeni") { u.set("sira", sira.value); }
      history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : ""));
      var wa2 = $("[data-wa-aradigim]");
      if (wa2) {
        var istek = Object.keys(f).filter(function (k) { return f[k]; }).map(function (k) {
          var el = form.elements[k]; var et = el.closest("label").querySelector("span").textContent;
          var deger = el.tagName === "SELECT" ? el.options[el.selectedIndex].text : el.value;
          return et + ": " + deger;
        }).join(", ");
        wa2.href = wa(t("arac.wa_aradigim_mesaj") + istek); wa2.target = "_blank"; wa2.rel = "noopener";
      }
    }
    form.addEventListener("input", uygula);
    form.addEventListener("change", uygula);
    sira.addEventListener("change", uygula);
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    $$("[data-filtre-temizle]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); form.reset(); uygula(); }); });
    $$("[data-filtre-ac]").forEach(function (b) { b.addEventListener("click", function () { filtre.classList.add("acik"); document.body.style.overflow = "hidden"; var i = $("input,select", filtre); if (i) { i.focus(); } }); });
    $$("[data-filtre-kapat]").forEach(function (b) { b.addEventListener("click", function () { filtre.classList.remove("acik"); document.body.style.overflow = ""; }); });
    if (VERI.guncelleme) {
      var d = new Date(VERI.guncelleme);
      if (!isNaN(d)) { $("[data-guncelleme]").textContent = t("arac.son_guncelleme") + ": " + d.toLocaleDateString(YEREL, { day: "numeric", month: "long", year: "numeric" }) + "."; }
    }
    uygula();
  }

  /* ---------------- araç detay: arama motorları için yapılandırılmış veri (Car + teklif) ve sayfa açıklaması */
  function aracYapisalVeri(a) {
    var ac = t("arac.paylasim_aciklama", { yil: a.yil, km: sayi(a.km || 0), yakit: a.yakit ? t("arac.yakit_" + a.yakit) : "", vites: a.vites ? t("arac.vites_" + a.vites) : "" });
    var md = $('meta[name="description"]'); if (md) { md.setAttribute("content", ac); }
    if ($("script[data-arac-ld]")) { return; }   // sunucu (arac.php) zaten eklediyse tekrar ekleme
    var yakit = { benzin: "Gasoline", dizel: "Diesel", hibrit: "Hybrid", elektrik: "Electric", lpg: "LPG" };
    var veri = { "@context": "https://schema.org", "@type": a.kategori === "motosiklet" ? "Motorcycle" : "Car",
      name: aracTamAd(a), brand: { "@type": "Brand", name: a.marka }, model: [seriAdi(a), a.model].filter(Boolean).join(" "),
      vehicleModelDate: String(a.yil), mileageFromOdometer: { "@type": "QuantitativeValue", value: a.km || 0, unitCode: "KMT" },
      fuelType: yakit[a.yakit] || a.yakit, vehicleTransmission: a.vites ? t("arac.vites_" + a.vites) : undefined, color: a.renk || undefined,
      itemCondition: "https://schema.org/UsedCondition", description: ac, url: location.href.split("#")[0],
      image: (a.fotograflar || []).slice(0, 5).map(function (u) { return u.replace("/x5_", "/x16_"); }),
      offers: { "@type": "Offer", price: a.fiyat, priceCurrency: "TRY", availability: "https://schema.org/InStock", itemCondition: "https://schema.org/UsedCondition",
        seller: { "@type": "AutoDealer", name: "Balkar Otomotiv", telephone: AYAR.telefon } } };
    var s = document.createElement("script"); s.type = "application/ld+json"; s.setAttribute("data-arac-ld", "");
    s.textContent = JSON.stringify(veri); document.head.appendChild(s);
  }

  /* ---------------- araç detay */
  function detay() {
    var kok = $("[data-detay]");
    if (!kok) { return; }
    var id = new URLSearchParams(location.search).get("id");
    var a = ARACLAR.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!a) { $("[data-bulunamadi]").hidden = false; return; }
    kok.hidden = false;
    document.title = aracTamAd(a) + " – " + para(a.fiyat) + " | Balkar Otomotiv";
    aracYapisalVeri(a);
    function alan(ad, html) { var e = $('[data-alan="' + ad + '"]', kok); if (e) { e.innerHTML = html; } }
    alan("kategori", kacis(t("arac.kategori_" + a.kategori)));
    alan("baslik", kacis(a.yil + " " + aracAdi(a)));
    alan("model", kacis(a.model || ""));
    alan("fiyat", a.fiyat ? para(a.fiyat) : "");
    var hizli = [];
    if (a.km != null) { hizli.push(["gosterge", t("arac.km"), sayi(a.km) + " km"]); }
    if (a.yakit) { hizli.push(["yakit", t("arac.yakit"), t("arac.yakit_" + a.yakit)]); }
    if (a.vites) { hizli.push(["vites", t("arac.vites"), t("arac.vites_" + a.vites)]); }
    hizli.push(["takvim", t("arac.yil"), a.yil]);
    alan("hizli", hizli.slice(0, 4).map(function (h) { return "<li>" + ikon(h[0]) + "<span><small>" + kacis(h[1]) + "</small>" + kacis(h[2]) + "</span></li>"; }).join(""));

    var oz = [
      [t("arac.marka"), a.marka], [t("arac.seri_model"), [seriAdi(a), a.model].filter(Boolean).join(" ")],
      [t("arac.yil"), a.yil], [t("arac.km"), a.km != null ? sayi(a.km) + " km" : ""],
      [t("arac.yakit"), a.yakit ? t("arac.yakit_" + a.yakit) : ""], [t("arac.vites"), a.vites ? t("arac.vites_" + a.vites) : ""],
      [t("arac.kasa"), a.kasa ? ceviriVeyaHam("kasa", a.kasa) : ""], [t("arac.renk"), ceviriVeyaHam("renk", a.renk)],
      [t("arac.motor_gucu"), a.motor_gucu], [t("arac.motor_hacmi"), a.motor_hacmi],
      [t("arac.cekis"), a.cekis ? ceviriVeyaHam("cekis", a.cekis) : ""], [t("arac.kategori"), t("arac.kategori_" + a.kategori)],
      [t("arac.servis_garantisi"), a.servis_garantisi === true ? t("arac.evet") : (a.servis_garantisi === false ? t("arac.hayir") : "")],
      [t("arac.ilan_no"), a.id], [t("arac.ilan_tarihi"), a.ilan_tarihi ? new Date(a.ilan_tarihi).toLocaleDateString(YEREL) : ""]
    ].filter(function (r) { return r[1] !== "" && r[1] != null; });
    alan("ozellikler", oz.map(function (r) { return "<div><dt>" + kacis(r[0]) + "</dt><dd>" + kacis(r[1]) + "</dd></div>"; }).join(""));

    if (a.hasar) {
      var h = a.hasar, yok = t("arac.yok");
      var tr = h.agir_hasar && h.tramer_tl == null ? t("arac.tramer_agir") : (h.tramer_tl ? para(h.tramer_tl) : (h.tramer_tl === 0 ? t("arac.tramer_kayitsiz") : ""));
      var satir = [
        [t("arac.degisen"), cokDilli(h.degisen) || yok, !h.degisen],
        [t("arac.boya"), cokDilli(h.boya) || yok, !h.boya],
        [t("arac.lokal"), cokDilli(h.lokal) || yok, !h.lokal],
        [t("arac.tramer"), tr, h.tramer_tl === 0],
        [t("arac.agir_hasar"), h.agir_hasar ? t("arac.evet") : t("arac.hayir"), !h.agir_hasar, h.agir_hasar]
      ].filter(function (r) { return r[1]; });
      $("[data-hasar-bolum]").hidden = false;
      alan("hasar", satir.map(function (r) { return '<div class="' + (r[3] ? "uyari" : (r[2] ? "temiz" : "")) + '"><dt>' + kacis(r[0]) + "</dt><dd>" + kacis(r[1]) + "</dd></div>"; }).join(""));
    }

    var ac = a.aciklama || {};
    var metin = ac[DIL] || ac.tr || "";
    var basl = a.baslik ? (DIL === "tr" ? a.baslik : t("arac.ilan_basligi") + ": " + a.baslik) : "";
    if (metin || basl) {
      $("[data-aciklama-bolum]").hidden = false;
      $("[data-aciklama-not]").hidden = !(DIL !== "tr" && !ac[DIL]);
      alan("aciklama", (basl ? "<p><b>" + kacis(basl) + "</b></p>" : "") + (metin ? "<p>" + kacis(metin) + "</p>" : ""));
    }

    var mesaj = t("arac.wa_arac_mesaj", { arac: aracTamAd(a), id: a.id });
    var w = $("[data-wa-arac]"); w.href = wa(mesaj); w.target = "_blank"; w.rel = "noopener";
    $$("[data-wa]").forEach(function (x) { x.href = wa(mesaj); });
    $("[data-randevu-link]").href = "iletisim.html?arac=" + encodeURIComponent(aracTamAd(a) + " (" + a.id + ")") + "#randevu";
    $("[data-kredi-link]").href = "kredi.html?fiyat=" + (a.fiyat || "") + "&arac=" + encodeURIComponent(aracTamAd(a));
    var sb = $("[data-sahibinden-link]");
    if (a.sahibinden_url) { sb.href = a.sahibinden_url; } else { sb.hidden = true; }

    // galeri
    var foto = (a.fotograflar || []).filter(Boolean), i = 0;
    var buyuk = $("[data-galeri-buyuk]"), sayac = $("[data-galeri-sayac]"), kucuk = $("[data-galeri-kucuk]");
    buyuk.alt = aracTamAd(a); buyuk.referrerPolicy = "no-referrer";
    buyuk.onerror = function () { if (buyuk.src.indexOf("/x16_") > -1) { buyuk.src = foto[i]; } else { buyuk.style.visibility = "hidden"; } };
    function goster(n) {
      if (!foto.length) { buyuk.style.visibility = "hidden"; return; }
      i = (n + foto.length) % foto.length; buyuk.style.visibility = ""; buyuk.src = buyukFoto(foto[i]);
      var sonraki = new Image(); sonraki.referrerPolicy = "no-referrer"; sonraki.src = buyukFoto(foto[(i + 1) % foto.length]);
      sayac.textContent = (i + 1) + " / " + foto.length;
      $$("button", kucuk).forEach(function (b, j) { b.setAttribute("aria-current", j === i ? "true" : "false"); });
    }
    if (foto.length > 1) {
      kucuk.innerHTML = foto.map(function (f, j) { return '<button type="button" aria-label="' + kacis(t("arac.foto_sonraki")) + " " + (j + 1) + '"><img src="' + kacis(f) + '" alt="" loading="lazy" referrerpolicy="no-referrer"></button>'; }).join("");
      $$("button", kucuk).forEach(function (b, j) { b.addEventListener("click", function () { goster(j); }); });
    } else {
      $$(".galeri-ok").forEach(function (b) { b.hidden = true; }); sayac.hidden = true;
    }
    $$("[data-galeri-git]").forEach(function (b) { b.addEventListener("click", function () { goster(i + Number(b.dataset.galeriGit)); }); });
    var x0 = null, ana = $(".galeri-ana");
    ana.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    ana.addEventListener("touchend", function (e) { if (x0 == null) { return; } var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { goster(i + (dx < 0 ? 1 : -1)); } x0 = null; });
    document.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { goster(i + 1); } if (e.key === "ArrowLeft") { goster(i - 1); } });
    goster(0);

    var benzer = ARACLAR.filter(function (x) { return x.id !== a.id; })
      .sort(function (x, y) { return (x.kategori === a.kategori ? 0 : 1e9) + Math.abs(x.fiyat - a.fiyat) - ((y.kategori === a.kategori ? 0 : 1e9) + Math.abs(y.fiyat - a.fiyat)); })
      .slice(0, 3);
    if (benzer.length) { $("[data-benzer-bolum]").hidden = false; $("[data-benzer]").innerHTML = benzer.map(kartHTML).join(""); }
  }

  /* ---------------- kredi */
  function kredi() {
    var k = $("[data-kredi]");
    if (!k) { return; }
    var f = $("form", k);
    function oku(el) { return Number(String(el.value).replace(/[^\d]/g, "")) || 0; }
    function yaz(el, n) { el.value = n ? sayi(n) : ""; }
    var p = new URLSearchParams(location.search);
    if (p.get("fiyat")) { var fy = Number(p.get("fiyat")); yaz(f.fiyat, fy); yaz(f.pesinat, Math.round(fy * 0.4 / 1000) * 1000); }
    if (p.get("arac")) { var ka = $("[data-kredi-arac]"); ka.hidden = false; ka.innerHTML = kacis(t("sayfalar.kredi_arac_secili")) + ": <b>" + kacis(p.get("arac")) + "</b>"; }

    function hesapla() {
      var fiyat = oku(f.fiyat), pes = Math.min(oku(f.pesinat), fiyat);
      var vade = Number((f.querySelector("[name=vade]:checked") || {}).value || 12);
      var r = (Number(String(f.faiz.value).replace(",", ".")) || 0) / 100;
      var tutar = Math.max(fiyat - pes, 0);
      var aylik = r > 0 ? tutar * r / (1 - Math.pow(1 + r, -vade)) : tutar / vade;
      var toplam = aylik * vade;
      $('[data-sonuc="aylik"]').textContent = tutar ? para(aylik) : "–";
      $('[data-sonuc="tutar"]').textContent = para(tutar);
      $('[data-sonuc="faiz"]').textContent = para(toplam - tutar);
      $('[data-sonuc="toplam"]').textContent = para(toplam + pes);
      $("[data-pesinat-yuzde]").textContent = fiyat ? "%" + Math.round(pes / fiyat * 100) : "";
      if (fiyat) { f.pesinat_kaydir.value = Math.round(pes / fiyat * 100); }
      var w = $("[data-kredi-wa]");
      w.href = wa(t("sayfalar.kredi_wa_mesaj", { fiyat: para(fiyat), pesinat: para(pes), vade: vade }) + (p.get("arac") ? " (" + p.get("arac") + ")" : ""));
      w.target = "_blank"; w.rel = "noopener";
    }
    $$("[data-para]", f).forEach(function (el) { el.addEventListener("input", function () { var n = oku(el); yaz(el, n); hesapla(); }); });
    f.pesinat_kaydir.addEventListener("input", function () { yaz(f.pesinat, Math.round(oku(f.fiyat) * f.pesinat_kaydir.value / 100 / 1000) * 1000); hesapla(); });
    f.addEventListener("change", hesapla); f.faiz.addEventListener("input", hesapla);
    hesapla();
  }

  /* ---------------- WhatsApp formları */
  /* ---------- Aracını sat: isteğe bağlı fotoğraflar (en fazla data-maks, tarayıcıda 1600 px'e küçültülür,
     sunucuya yüklenir; WhatsApp mesajına tek galeri bağlantısı eklenir). Yükleme olmazsa mesaj yine gider. */
  var MAKS_HAM = 25 * 1024 * 1024;           // tarayıcıda işlenecek en büyük ham dosya
  function fotoKutusu(form) {
    var kutu = $("[data-foto-yukle]", form);
    if (!kutu) { return; }
    var maks = Number(kutu.dataset.maks) || 8, sec = $("[data-foto-sec]", kutu), liste = $("[data-foto-liste]", kutu),
      sayac = $("[data-foto-sayac]", kutu), uyari = $("[data-foto-uyari]", kutu);
    form._fotolar = [];
    function ciz() {
      liste.innerHTML = "";
      form._fotolar.forEach(function (f, i) {
        var d = document.createElement("div"); d.className = "foto-oge";
        var im = document.createElement("img"); im.alt = ""; im.src = f.onizleme; d.appendChild(im);
        var b = document.createElement("button"); b.type = "button"; b.className = "foto-sil"; b.setAttribute("aria-label", t("sayfalar.sat_foto_kaldir")); b.textContent = "×";
        b.addEventListener("click", function () { URL.revokeObjectURL(f.onizleme); form._fotolar.splice(i, 1); uyari.hidden = true; ciz(); });
        d.appendChild(b); liste.appendChild(d);
      });
      sayac.textContent = form._fotolar.length ? t("sayfalar.sat_foto_sayac", { adet: form._fotolar.length, n: maks }) : "";
      $(".foto-ekle", kutu).classList.toggle("pasif", form._fotolar.length >= maks);
    }
    sec.addEventListener("change", function () {
      var fazla = false;
      Array.prototype.forEach.call(sec.files, function (f) {
        if (!/^image\//.test(f.type) || f.size > MAKS_HAM) { return; }
        if (form._fotolar.length >= maks) { fazla = true; return; }
        form._fotolar.push({ dosya: f, onizleme: URL.createObjectURL(f) });
      });
      sec.value = "";
      uyari.hidden = !fazla; if (fazla) { uyari.textContent = t("sayfalar.sat_foto_sinir", { n: maks }); }
      ciz();
    });
    ciz();
  }
  function kucult(f) {
    return new Promise(function (tamam) {
      var img = new Image(), u = URL.createObjectURL(f);
      img.onload = function () {
        var o = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * o); c.height = Math.round(img.naturalHeight * o);
        var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        c.toBlob(function (b) { tamam(b || f); }, "image/jpeg", 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(u); tamam(f); };
      img.src = u;
    });
  }
  function gonder(form, satirlar) {
    var fotolar = form._fotolar || [];
    if (!fotolar.length) { window.open(wa(satirlar.join("\n")), "_blank", "noopener"); return; }
    var kutu = $("[data-foto-yukle]", form), uyari = $("[data-foto-uyari]", kutu), dugme = $('button[type="submit"]', form);
    /* pencere tıklama anında açılır (sonradan açılırsa tarayıcı engeller), yükleme bitince WhatsApp'a yönlendirilir */
    var pencere = window.open("", "_blank");
    if (pencere) { try { pencere.opener = null; pencere.document.title = "WhatsApp"; pencere.document.body.innerHTML = '<p style="font:16px system-ui;padding:24px">' + kacis(t("sayfalar.sat_foto_yukleniyor")) + "</p>"; } catch (e) { /* farklı köken */ } }
    var eskiYazi = dugme.innerHTML; dugme.disabled = true; dugme.textContent = t("sayfalar.sat_foto_yukleniyor"); uyari.hidden = true;
    function bitir(link, hata) {
      if (link) { satirlar.push(t("sayfalar.sat_foto_wa") + " (" + fotolar.length + "): " + link); }
      if (hata) { uyari.textContent = t(hata); uyari.hidden = false; }
      dugme.disabled = false; dugme.innerHTML = eskiYazi;
      var url = wa(satirlar.join("\n"));
      if (pencere && !pencere.closed) { pencere.location.href = url; } else { location.href = url; }
    }
    Promise.all(fotolar.map(function (f) { return kucult(f.dosya); })).then(function (bloblar) {
      var fd = new FormData();
      bloblar.forEach(function (b, i) { fd.append("foto[]", b, "foto" + (i + 1) + ".jpg"); });
      fd.append("web_adresi", ($('[name="web_adresi"]', form) || {}).value || "");
      var iptal = window.AbortController ? new AbortController() : null, sure = setTimeout(function () { if (iptal) { iptal.abort(); } }, 60000);
      return fetch(kutu.dataset.uc, { method: "POST", body: fd, signal: iptal ? iptal.signal : undefined }).then(function (r) {
        clearTimeout(sure);
        return r.json().catch(function () { return { ok: false }; }).then(function (j) { j.durum = r.status; return j; });
      });
    }).then(function (j) {
      if (j && j.ok && j.link) { bitir(j.link); } else { bitir(null, j && j.durum === 429 ? "sayfalar.sat_foto_cok" : "sayfalar.sat_foto_hata"); }
    }).catch(function () { bitir(null, "sayfalar.sat_foto_hata"); });
  }

  /* ---------- Bilgisayarda "Ara" / telefon numarası: tarayıcı arama yapamadığı için numarayı büyük gösteren pencere.
     Dokunmatik telefonlarda tel: bağlantısı normal çalışır (doğrudan arama ekranı açılır). */
  function aramaPenceresi() {
    if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) { return; }
    var d = null;
    function kur() {
      d = document.createElement("dialog"); d.className = "ara-pencere"; d.setAttribute("aria-labelledby", "ara-baslik");
      d.innerHTML = '<button type="button" class="ara-kapat" aria-label="' + kacis(t("ortak.kapat")) + '">×</button>' +
        '<div class="ara-ikon">' + ikon("tel") + "</div>" +
        '<h2 id="ara-baslik">' + kacis(t("ortak.ara_baslik")) + "</h2>" +
        '<p class="ara-numara" data-ara-numara></p>' +
        '<p class="ara-not">' + kacis(t("ortak.ara_not")) + "</p>" +
        '<p class="ara-saat">' + ikon("saat") + kacis(t("ortak.saat_hafta") + " " + AYAR.saat + " · " + t("ortak.saat_pazar") + ": " + t("ortak.kapali")) + "</p>" +
        '<div class="ara-dugmeler"><button type="button" class="dugme dugme-cizgi" data-ara-kopyala>' + ikon("belge") + "<span>" + kacis(t("ortak.ara_kopyala")) + "</span></button>" +
        '<a class="dugme dugme-altin" target="_blank" rel="noopener" href="' + kacis(wa(t("ortak.wa_genel_mesaj"))) + '">' + ikon("mesaj") + "WhatsApp</a></div>";
      document.body.appendChild(d);
      $(".ara-kapat", d).addEventListener("click", function () { d.close(); });
      d.addEventListener("click", function (e) { if (e.target === d) { d.close(); } });   /* dışına tıklayınca kapanır */
      $("[data-ara-kopyala]", d).addEventListener("click", function () {
        var b = this, yazi = $("span", b), numara = d.dataset.numara;
        function oldu() { yazi.textContent = t("ortak.ara_kopyalandi"); setTimeout(function () { yazi.textContent = t("ortak.ara_kopyala"); }, 2000); }
        if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(numara).then(oldu, oldu); }
        else { var g = document.createElement("textarea"); g.value = numara; document.body.appendChild(g); g.select(); try { document.execCommand("copy"); } catch (e) {} g.remove(); oldu(); }
      });
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="tel:"]');
      if (!a) { return; }
      e.preventDefault();
      if (!d) { kur(); }
      var ham = a.getAttribute("href").slice(4), gorunen = ham === AYAR.telefon ? AYAR.telefon_gorunen : ham.replace(/^\+90/, "0");
      d.dataset.numara = gorunen; $("[data-ara-numara]", d).textContent = gorunen;
      if (d.showModal) { d.showModal(); } else { d.setAttribute("open", ""); }
    });
  }

  function formlar() {
    $$("[data-wa-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var tamam = true;
        $$("[required]", form).forEach(function (el) {
          var bos = el.type === "checkbox" ? !el.checked : !String(el.value).trim();
          var kap = el.closest(".alan, .onay"); if (kap) { kap.classList.toggle("hatali", bos); }
          if (bos && tamam) { el.focus(); }
          if (bos) { tamam = false; }
        });
        var hataYazi = t("ortak.form_hata");
        $$("[data-yil-alan]", form).forEach(function (el) {   // dolu ise geçerli bir yıl olmalı (1900 – gelecek yıl)
          if (!el.value || yilGecerli(el.value)) { return; }
          var kap = el.closest(".alan"); if (kap) { kap.classList.add("hatali"); }
          if (tamam) { el.focus(); hataYazi = t("ortak.yil_hata"); }
          tamam = false;
        });
        var hata = $("[data-form-hata]", form); hata.textContent = hataYazi; hata.hidden = tamam;
        if (!tamam) { return; }
        var satirlar = ["*" + form.dataset.baslik + "*"];
        $$("[data-etiket]", form).forEach(function (el) {
          if ((el.type === "radio" || el.type === "checkbox") && !el.checked) { return; }
          var v = el.tagName === "SELECT" ? (el.value ? el.options[el.selectedIndex].text : "") : String(el.value).trim();
          if (v) { satirlar.push(el.dataset.etiket + ": " + v); }
        });
        gonder(form, satirlar);
      });
      fotoKutusu(form);
      $$("input,select,textarea", form).forEach(function (el) {
        el.addEventListener("input", function () { var k = el.closest(".alan, .onay"); if (k) { k.classList.remove("hatali"); } });
        el.addEventListener("change", function () { var k = el.closest(".alan, .onay"); if (k) { k.classList.remove("hatali"); } });
      });
    });
    var arac = $("[data-arac-doldur]"), p = new URLSearchParams(location.search);
    if (arac && p.get("arac")) { arac.value = p.get("arac"); }
    /* hizmetler sayfasından gelen seçim: aracini-sat.html?istek=sat | takas | fiyat */
    if (p.get("istek")) {
      var secim = $('input[name="istek"][data-istek="' + p.get("istek").replace(/[^a-z]/g, "") + '"]');
      if (secim) { secim.checked = true; secim.dispatchEvent(new Event("change", { bubbles: true })); }
    }
    var tarih = $("[data-tarih-sinir]");
    if (tarih) {
      var d = new Date(); tarih.min = d.toISOString().slice(0, 10);
      tarih.addEventListener("change", function () {
        var pazar = tarih.value && new Date(tarih.value + "T12:00:00").getDay() === 0;
        $("[data-pazar-uyari]").hidden = !pazar;
        if (pazar) { tarih.value = ""; }
      });
    }
  }

  /* ---------- ölçülü animasyonlar: bölümler ve kartlar ekrana girerken yumuşakça belirir.
     Hareket azaltma tercihi açıksa veya tarayıcı desteklemiyorsa hiç çalışmaz (içerik hep görünür). */
  function animasyonlar() {
    var ust = $("#ust");
    if (ust) {
      var golge = function () { ust.classList.toggle("kaydirildi", window.scrollY > 8); };
      golge(); window.addEventListener("scroll", golge, { passive: true });
    }
    if (!("IntersectionObserver" in window) || !window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { return; }
    var SECICI = ".bolum-bas, .arac-kart, .ilke, .adimlar li, .yorumlar, .yazi-kart, .hizmet, .deger, .ekip-kisi, .kredi-bant, " +
      ".guven-oge, .detay-bilgi, .detay-hasar, .detay-aciklama, .kart-form, .yan-bilgi section, .iletisim-bant-ic > *, .harita, .kredi-sonuc, .makale > *";
    document.documentElement.classList.add("anim");
    var gozcu = new IntersectionObserver(function (girdiler) {
      girdiler.forEach(function (g) {
        if (!g.isIntersecting) { return; }
        var el = g.target; gozcu.unobserve(el);
        el.classList.add("gorundu");
        /* belirme bitince sınıfları kaldır: üzerine gelme (hover) efektleri normal çalışsın */
        setTimeout(function () { el.classList.remove("gor", "gorundu"); el.style.removeProperty("--gec"); }, 1200);
      });
    }, { rootMargin: "0px 0px -40px 0px", threshold: 0.08 });
    function hazirla(kok) {
      var liste = (kok.matches && kok.matches(SECICI)) ? [kok] : [];
      liste = liste.concat($$(SECICI, kok));
      liste.forEach(function (el) {
        if (el.classList.contains("gor") || el.dataset.anim) { return; }
        el.dataset.anim = "1";
        var kardesler = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.setProperty("--gec", (Math.min(kardesler, 5) * 70) + "ms");   /* yan yana öğeler sırayla */
        el.classList.add("gor");
        gozcu.observe(el);
      });
    }
    hazirla(document.body);
    /* araç kartları JS ile sonradan eklendiği için (vitrin, liste, filtre) yeni öğeleri de yakala */
    new MutationObserver(function (degisim) {
      degisim.forEach(function (d) { d.addedNodes.forEach(function (n) { if (n.nodeType === 1) { hazirla(n); } }); });
    }).observe(document.getElementById("icerik") || document.body, { childList: true, subtree: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    markaSecicileri(); arayuz(); anasayfa(); liste(); detay(); kredi(); formlar(); aramaPenceresi(); animasyonlar();
  });
})();
