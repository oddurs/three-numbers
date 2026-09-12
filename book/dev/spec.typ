#set page(width: 170mm, height: 128mm, margin: 12mm, fill: white)
#set par(justify: true, leading: 0.78em)
#let sample = [The CIE 1931 standard observer integrates a spectrum against three
curves, and 0.2126 of the result is red. Chromaticity 0.3127, 0.3290 at 6504 K.]

#text(font: "ETBookOT", size: 11.5pt)[*ETBookOT 11.5pt* #sample]
#v(3mm)
#text(font: "ETBookOT", size: 10.5pt)[*ETBookOT 10.5pt* #sample]
#v(3mm)
#text(font: "Libertinus Serif", size: 10.5pt)[*Libertinus 10.5pt* #sample]
#v(4mm)
#text(font: "ETBookOT", size: 11.5pt)[Italic: #emph[the spectrum locus is convex] — and math: #text(font: "STIX Two Math")[$L^* = 116 f(Y\/Y_n) - 16$]]
#v(2mm)
#text(font: "ETBookOT", size: 11.5pt)[NCM math instead: #text(font: "New Computer Modern Math")[$L^* = 116 f(Y\/Y_n) - 16$]]
