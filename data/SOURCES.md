# Datasets

All tables are the published measured/standard data, fetched from the Colour &
Vision Research Laboratory (CVRL, UCL) database at <http://cvrl.ioo.ucl.ac.uk>.
They are used here for scholarly illustration; each is the authoritative
published form of a CIE standard or a peer-reviewed dataset.

| File | Contents | Grid | Source |
|---|---|---|---|
| `ciexyz31.csv` | CIE 1931 2° standard colorimetric observer, x̄ ȳ z̄ | 360–830 nm, 5 nm | CIE 1931 (CVRL `cmfs/ciexyz31.csv`) |
| `ciexyz64.csv` | CIE 1964 10° standard colorimetric observer | 360–830 nm, 5 nm | CIE 1964 (CVRL `cmfs/ciexyz64.csv`) |
| `ciexyzjv.csv` | Judd (1951) / Vos (1978) modified 2° observer | 380–825 nm, 5 nm | CVRL `cmfs/ciexyzjv.csv` |
| `linss2_10e_5.csv` | Stockman & Sharpe (2000) 2° cone fundamentals, linear energy | 390–830 nm, 5 nm | CVRL `cones/linss2_10e_5.csv` |
| `Illuminantd65.csv` | CIE standard illuminant D65 relative SPD | 300–830 nm, 1 nm | CIE 15 (CVRL `cie/Illuminantd65.csv`) |
| `IlluminantA.csv` | CIE standard illuminant A relative SPD | 300–830 nm, 1 nm | CIE 15 (CVRL `cie/IlluminantA.csv`) |

Blank cells in the cone-fundamental file (where the S cone response is below the
measurement floor) are read as exact zero.

To refresh, run `node engine/cli.ts fetch-data`.
