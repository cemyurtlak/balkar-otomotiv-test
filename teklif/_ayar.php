<?php
/* Aracını sat formu – fotoğraf yükleme ayarları ve ortak yardımcılar.
   Sınırlar kötüye kullanıma (çok sayıda / büyük dosya ile sunucuyu doldurma) karşıdır. */
declare(strict_types=1);
date_default_timezone_set('Europe/Istanbul');

const T_MAKS_FOTO      = 8;                 // bir gönderimde en fazla fotoğraf
const T_MAKS_BOYUT     = 4 * 1024 * 1024;   // dosya başına en fazla 4 MB (tarayıcı zaten küçültüp gönderir)
const T_MAKS_PIKSEL    = 40000000;          // 40 MP üstü reddedilir (sıkıştırma bombası koruması)
const T_KENAR          = 1600;              // sunucuda en uzun kenar 1600 px'e indirilir
const T_KALITE         = 82;                // JPEG kalitesi
const T_IP_SAATLIK     = 5;                 // aynı IP'den saatte en fazla 5 gönderim
const T_IP_GUNLUK      = 15;                // aynı IP'den günde en fazla 15 gönderim
const T_GENEL_GUNLUK   = 200;               // tüm site için günde en fazla 200 gönderim
const T_KOTA           = 1024 * 1024 * 1024;// klasör toplamı en fazla 1 GB
const T_SAKLAMA_GUN    = 30;                // fotoğraflar 30 gün sonra otomatik silinir

define('T_KLASOR', dirname(__DIR__) . '/veri/teklif');

function t_klasor_hazirla(): void {
    if (!is_dir(T_KLASOR)) { mkdir(T_KLASOR, 0755, true); }
    $ht = T_KLASOR . '/.htaccess';
    if (!is_file($ht)) {
        file_put_contents($ht, "Options -Indexes\n<FilesMatch \"\\.(php|phtml|phar|pl|py|cgi|sh|html?)$\">\n  Require all denied\n</FilesMatch>\n");
    }
    if (!is_file(T_KLASOR . '/index.html')) { file_put_contents(T_KLASOR . '/index.html', ''); }
}

function t_jeton_gecerli(string $k): bool { return (bool)preg_match('/^[a-f0-9]{24}$/', $k); }

/** 30 günden eski gönderim klasörlerini siler. */
function t_temizle(): void {
    $sinir = time() - T_SAKLAMA_GUN * 86400;
    foreach (glob(T_KLASOR . '/*', GLOB_ONLYDIR) ?: [] as $d) {
        if (t_jeton_gecerli(basename($d)) && filemtime($d) < $sinir) {
            foreach (glob($d . '/*') ?: [] as $f) { @unlink($f); }
            @rmdir($d);
        }
    }
}

function t_klasor_boyutu(): int {
    $top = 0;
    foreach (glob(T_KLASOR . '/*/*.jpg') ?: [] as $f) { $top += (int)filesize($f); }
    return $top;
}
