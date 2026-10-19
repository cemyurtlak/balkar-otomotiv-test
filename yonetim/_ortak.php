<?php
/* Balkar Otomotiv yönetim paneli – ortak işlevler */
declare(strict_types=1);
mb_internal_encoding('UTF-8');
date_default_timezone_set('Europe/Istanbul');

const VERI_KLASOR = __DIR__ . '/../veri';
const ARAC_JSON   = VERI_KLASOR . '/araclar.json';
const ARAC_JS     = VERI_KLASOR . '/araclar.js';
const YEDEK       = VERI_KLASOR . '/yedek';
const FOTO        = VERI_KLASOR . '/foto';
const SIFRE_DOSYA = __DIR__ . '/sifre.php';
const KATEGORILER = ['otomobil' => 'Otomobil', 'suv' => 'Arazi, SUV & Pickup', 'motosiklet' => 'Motosiklet', 'ticari' => 'Ticari araç'];
const YAKITLAR    = ['' => '—', 'benzin' => 'Benzin', 'dizel' => 'Dizel', 'hibrit' => 'Hibrit', 'elektrik' => 'Elektrik', 'lpg' => 'Benzin & LPG'];
const VITESLER    = ['' => '—', 'otomatik' => 'Otomatik', 'manuel' => 'Manuel', 'yari_otomatik' => 'Yarı otomatik'];
const KASALAR     = ['' => '—', 'sedan' => 'Sedan', 'hatchback' => 'Hatchback', 'station' => 'Station wagon', 'suv' => 'SUV', 'coupe' => 'Coupe', 'cabrio' => 'Cabrio', 'mpv' => 'MPV', 'pickup' => 'Pickup'];
const CEKISLER    = ['' => '—', 'onden' => 'Önden çekiş', 'arkadan' => 'Arkadan itiş', '4wd' => '4x4'];

ini_set('session.cookie_httponly', '1');
ini_set('session.use_strict_mode', '1');
if (!empty($_SERVER['HTTPS'])) { ini_set('session.cookie_secure', '1'); }
session_name('balkar_yonetim');
session_start();

function h($s): string { return htmlspecialchars((string)($s ?? ''), ENT_QUOTES, 'UTF-8'); }

function csrf(): string {
    if (empty($_SESSION['csrf'])) { $_SESSION['csrf'] = bin2hex(random_bytes(16)); }
    return $_SESSION['csrf'];
}
function csrf_alan(): string { return '<input type="hidden" name="csrf" value="' . csrf() . '">'; }
function csrf_dogrula(): void {
    if (!hash_equals($_SESSION['csrf'] ?? '', (string)($_POST['csrf'] ?? ''))) { http_response_code(400); exit('Oturum süresi doldu. Sayfayı yenileyip tekrar deneyin.'); }
}

function sifre_hash(): ?string {
    if (!is_file(SIFRE_DOSYA)) { return null; }
    $h = include SIFRE_DOSYA;
    return is_string($h) && $h !== '' ? $h : null;
}
function giris_var(): bool { return !empty($_SESSION['giris']) && ($_SESSION['zaman'] ?? 0) > time() - 8 * 3600; }

function veri_oku(): array {
    if (!is_file(ARAC_JSON)) { return ['guncelleme' => date('c'), 'kaynak' => '', 'araclar' => []]; }
    $v = json_decode((string)file_get_contents(ARAC_JSON), true);
    return is_array($v) ? $v + ['araclar' => []] : ['guncelleme' => date('c'), 'araclar' => []];
}

/** Veriyi kaydeder: önce yedek alır, sonra JSON ve JS dosyasını atomik yazar. */
function veri_yaz(array $v, string $kaynak): void {
    if (!is_dir(YEDEK)) { mkdir(YEDEK, 0755, true); }
    if (is_file(ARAC_JSON)) {
        copy(ARAC_JSON, YEDEK . '/araclar-' . date('Ymd-His') . '.json');
        $yedekler = glob(YEDEK . '/araclar-*.json') ?: [];
        sort($yedekler);
        while (count($yedekler) > 30) { @unlink(array_shift($yedekler)); }
    }
    $v['guncelleme'] = date('c');
    $v['kaynak'] = $kaynak;
    $v['araclar'] = array_values($v['araclar']);
    $json = json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    $js = 'window.ARACLAR=' . json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ';';
    file_put_contents(ARAC_JSON . '.tmp', $json, LOCK_EX); rename(ARAC_JSON . '.tmp', ARAC_JSON);
    file_put_contents(ARAC_JS . '.tmp', $js, LOCK_EX); rename(ARAC_JS . '.tmp', ARAC_JS);
}

function sayi_temizle($s): ?int {
    $s = preg_replace('/[^\d]/', '', (string)$s);
    return $s === '' ? null : (int)$s;
}

/** Türkçe yazımı anahtar biçimine çevirir: "Gümüş Gri" → "gumus_gri" */
function anahtar(string $s): string {
    $s = preg_replace('/(?<=[a-zçğıöşü0-9])(?=[A-ZÇĞİÖŞÜ])/u', '_', $s); // IlanBasligi → Ilan_Basligi
    $s = mb_strtolower(strtr($s, ['I' => 'ı', 'İ' => 'i']));
    $s = strtr($s, ['ı' => 'i', 'ğ' => 'g', 'ü' => 'u', 'ş' => 's', 'ö' => 'o', 'ç' => 'c', 'â' => 'a', 'î' => 'i']);
    return trim(preg_replace('/[^a-z0-9]+/', '_', $s), '_');
}

/** Serbest yazılmış yakıt/vites/kategori değerlerini site anahtarlarına çevirir. */
function yakit_esle(string $s): ?string {
    $k = anahtar($s);
    if ($k === '') { return null; }
    if (str_contains($k, 'lpg')) { return 'lpg'; }
    if (str_contains($k, 'hibrit') || str_contains($k, 'hybrid')) { return 'hibrit'; }
    if (str_contains($k, 'elektrik') || str_contains($k, 'electric')) { return 'elektrik'; }
    if (str_contains($k, 'dizel') || str_contains($k, 'diesel')) { return 'dizel'; }
    if (str_contains($k, 'benzin') || str_contains($k, 'petrol') || str_contains($k, 'gasoline')) { return 'benzin'; }
    return null;
}
function vites_esle(string $s): ?string {
    $k = anahtar($s);
    if ($k === '') { return null; }
    if (str_contains($k, 'yari')) { return 'yari_otomatik'; }
    if (str_contains($k, 'otomatik') || str_contains($k, 'auto')) { return 'otomatik'; }
    if (str_contains($k, 'manuel') || str_contains($k, 'manual') || str_contains($k, 'duz')) { return 'manuel'; }
    return null;
}
function kategori_esle(string $s): string {
    $k = anahtar($s);
    if (str_contains($k, 'motosiklet') || str_contains($k, 'motor')) { return 'motosiklet'; }
    if (str_contains($k, 'suv') || str_contains($k, 'arazi') || str_contains($k, 'pickup')) { return 'suv'; }
    if (str_contains($k, 'ticari') || str_contains($k, 'minivan') || str_contains($k, 'panelvan') || str_contains($k, 'kamyon')) { return 'ticari'; }
    return 'otomobil';
}

function sablon_bas(string $baslik): void { ?>
<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title><?= h($baslik) ?> – Balkar Yönetim</title>
<link rel="icon" href="../varliklar/img/favicon-32.png"><link rel="stylesheet" href="yonetim.css"></head><body>
<header class="y-ust"><a class="y-marka" href="index.php"><img src="../varliklar/img/logo-96.png" alt="" width="36" height="36">Balkar Yönetim</a>
<?php if (giris_var()): ?><nav><a href="index.php">Araçlar</a><a href="index.php?s=duzenle">Araç ekle</a><a href="index.php?s=aktar">Sahibinden dosyası yükle</a><a href="index.php?s=yedek">Yedekler</a><a href="../tr/araclar.html" target="_blank">Siteyi aç</a>
<form method="post" action="index.php?s=cikis"><?= csrf_alan() ?><button>Çıkış</button></form></nav><?php endif; ?></header>
<main class="y-kap">
<?php }
function sablon_son(): void { echo "</main></body></html>"; }
function mesaj(): void {
    if (!empty($_SESSION['mesaj'])) { echo '<p class="y-mesaj">' . h($_SESSION['mesaj']) . '</p>'; unset($_SESSION['mesaj']); }
    if (!empty($_SESSION['hata'])) { echo '<p class="y-mesaj y-hata">' . h($_SESSION['hata']) . '</p>'; unset($_SESSION['hata']); }
}
function git(string $u, string $m = '', bool $hata = false): never {
    if ($m !== '') { $_SESSION[$hata ? 'hata' : 'mesaj'] = $m; }
    header('Location: ' . $u); exit;
}
