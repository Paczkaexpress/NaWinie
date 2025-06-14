# Recipe Images

This directory should contain images for recipes. The image filename should match the recipe name with the following transformations:

1. Polish characters are replaced with their ASCII equivalents
2. Special characters are removed
3. Spaces are replaced with underscores
4. Everything is converted to lowercase

## Expected filenames for current recipes:

| Recipe Name | Expected Filename |
|-------------|-------------------|
| Klasyczne naleśniki | `klasyczne_nalesniki.jpg` |
| Awaryjne chlebki z patelni | `awaryjne_chlebki_z_patelni.jpg` |
| Makaron aglio e olio | `makaron_aglio_e_olio.jpg` |
| Jajecznica na maśle | `jajecznica_na_masle.jpg` |
| Owsianka na wodzie | `owsianka_na_wodzie.jpg` |
| Placuszki z bananów i jajek | `placuszki_z_bananow_i_jajek.jpg` |
| Surówka z marchewki | `surowka_z_marchewki.jpg` |
| Domowy sos vinaigrette | `domowy_sos_vinaigrette.jpg` |
| Pieczone ziemniaki | `pieczone_ziemniaki.jpg` |
| Szybka tortilla z mąki kukurydzianej | `szybka_tortilla_z_maki_kukurydzianej.jpg` |
| Koktajl banan-kakao | `koktajl_banan_kakao.jpg` |

## Supported formats:
- `.jpg`
- `.jpeg` 
- `.png`
- `.webp`

## Notes:
- Images will be automatically resized to 800x600 pixels
- Original aspect ratio will be maintained with smart cropping
- Files will be optimized to JPEG format for database storage
- If an image is not found, the recipe will be added without an image

## Polish character mapping:
- ą → a, ć → c, ę → e, ł → l, ń → n, ó → o, ś → s, ź → z, ż → z
- Ą → A, Ć → C, Ę → E, Ł → L, Ń → N, Ó → O, Ś → S, Ź → Z, Ż → Z 