OUTLINE_B = [
{"part": "III", "title": "Operations", "blurb":
 "Coordinates are for computing with. This part is about the four things "
 "programs actually do to colours --- mix them, measure the distance between "
 "them, squeeze them into a device's range, and re-anchor them to a different "
 "white --- and about the fact that each of these is wrong by default.",
 "chapters": [
  {"n": 8, "id": "ch08", "title": "Mixing Light",
   "epigraph": "Two colours have no midpoint. They have a midpoint in a space, and you have to say which one.",
   "source": None,
   "lead": "Interpolation is the operation programs perform most often on colour and get wrong most often. The fix is not a better formula; it is noticing that `lerp` needs a space argument and that the default choice is the worst available one.",
   "sections": [
    ("What a gradient is", "Framing: a gradient is a curve through a colour space, and its appearance depends entirely on which space it is a curve through. Show the same two endpoints interpolated five ways.", ("interpolation-spaces",), ("css-color-4",), 1300),
    ("Interpolating code values, and why it is wrong", "Work through blue-to-yellow in sRGB byte values and show exactly where the light goes. Then show the same failure in its other costumes: image resizing, box blur, mipmaps, and font antialiasing.", ("interpolation-spaces",), ("poynton-video",), 1600),
    ("Linear light, and its own failure mode", "Physically correct interpolation is not perceptually even --- it spends most of the ramp near the bright end. Explain why, and why 'just work in linear' is necessary but not sufficient.", (), (), 1100),
    ("Hue paths", "In a cylindrical space, two colours are joined by two arcs. Shorter, longer, increasing, decreasing --- the CSS Color 4 vocabulary --- and the specific artefact of accidentally taking the long way round through a hue nobody asked for.", ("interpolation-spaces",), ("css-color-4",), 1000),
    ("Compositing and alpha", "Porter-Duff, in linear light, with premultiplied alpha, and the three distinct bugs that come from getting any one of those three wrong. The dark-fringe artefact as a diagnostic.", (), ("porter-duff-1984",), 1500),
    ("Blend modes", "Multiply, screen, overlay and the rest as pointwise functions, why they are defined on linear light, and what the separable/non-separable distinction actually means.", (), (), 900),
   ]},
  {"n": 9, "id": "ch09", "title": "Distance",
   "epigraph": "CIEDE2000 has five correction terms. Each one is an apology for a failure of the space it corrects.",
   "source": None,
   "lead": "How different are two colours? The question sounds simple and has consumed seventy years of committee work. Follow the sequence from Euclidean distance to CIEDE2000 as a series of empirical failures and patches, then ask what Oklab's claim to need no patches actually amounts to.",
   "sections": [
    ("Just-noticeable differences", "MacAdam's experiment and its result: discrimination thresholds are ellipses, they vary by an order of magnitude, and they are oriented. Any metric that ignores this is wrong by a factor of ten somewhere.", (), ("macadam-1942-visual",), 1400),
    ("CIE76 and its failure", "Euclidean distance in CIELAB, the reason it was expected to work, and where it does not: saturated blues, near-neutrals, and lightness at the extremes.", ("delta-e-contours",), ("cie-15-colorimetry",), 1200),
    ("CIEDE2000, term by term", "Walk the formula and attribute every term to the failure it repairs: the chroma rescaling of a*, the three weighting functions, and the notorious rotation term that exists solely to fix the blue region. Verify the implementation against Sharma's published conformance set --- all thirty-four pairs --- and say so.", ("delta-e-contours",), ("sharma-2004-ciede2000",), 2000),
    ("What a delta-E means", "A sober section on interpretation. One unit is not one JND except approximately, under specific viewing conditions, for large uniform patches. Tolerancing in print, textiles and manufacturing, and the CMC formula's asymmetry as a cautionary tale.", (), ("sharma-2004-ciede2000",), 1200),
    ("Oklab, ICtCp, and modern metrics", "Euclidean distance in Oklab as a claim that the space is uniform enough not to need corrections. Delta-E ITP for HDR, where the old metrics have no defined behaviour above 100 nits.", ("delta-e-contours",), ("ottosson-oklab", "itu-bt2100"), 1300),
   ]},
  {"n": 10, "id": "ch10", "title": "Gamuts, Clipping and Mapping",
   "epigraph": "A gamut is a solid. The triangle is its shadow, and the shadow is missing the dimension where the problem lives.",
   "source": None,
   "lead": "Every display can produce a bounded set of colours, and every real pipeline eventually asks for one outside it. What happens next is a design decision that most software makes by accident, in the form of a clamp.",
   "sections": [
    ("The gamut as a solid", "Take the RGB cube through the transfer function and the matrix and look at the shape it makes in a perceptual space. Constant-hue slices, the cusp, and how violently the cusp's position varies with hue.", ("oklch-gamut-slice",), ("css-color-4",), 1500),
    ("Clipping, and what it costs", "Per-channel clamping is the default everywhere. Show what it does to hue --- it rotates it, visibly, and worst exactly where the colour was most saturated.", (), (), 1100),
    ("The CSS Color 4 algorithm", "Hold lightness and hue, binary-search chroma, accept when the clipped version is within a delta-E of the target. Explain why holding lightness rather than chroma is the right default, and implement it in twenty lines.", ("oklch-gamut-slice",), ("css-color-4",), 1400),
    ("Rendering intents", "Perceptual, relative colorimetric, saturation, absolute. What ICC actually specifies versus what vendors do, and why 'perceptual' is a vendor's opinion rather than a defined transform.", (), ("icc-v4",), 1300),
    ("Wider gamuts in practice", "Shipping P3 on the web, the fallback problem, and how to author once for two gamuts without either flattening the wide one or lying about the narrow one.", (), ("css-color-4",), 1100),
   ]},
  {"n": 11, "id": "ch11", "title": "Adaptation and White",
   "epigraph": "You have never seen the colour of anything. You have seen its colour relative to what your visual system has decided is white.",
   "source": None,
   "lead": "The eye re-normalises. A sheet of paper reads as white under tungsten and under noon daylight, though the light reaching the eye differs by a factor of three in the blue. Modelling that re-normalisation is chromatic adaptation, and it is the one piece of genuine perceptual modelling that ordinary pipelines cannot avoid.",
   "sections": [
    ("Von Kries and independent gain control", "The hypothesis: each cone class scales independently to normalise the white. Three numbers, three gains. Show that this crude model explains most of what happens.", (), ("fairchild-appearance",), 1200),
    ("Sharpened bases", "Bradford, CAT02 and CAT16 are all the same three-step construction with a different middle basis, and the bases are sharpened *beyond* physiology because doing so predicts the data better. That fact deserves a paragraph of discomfort.", (), ("fairchild-appearance",), 1300),
    ("Doing it in code", "The adaptation matrix as a product of three matrices, the D50/D65 transform that every ICC profile contains, and where in a pipeline adaptation belongs.", (), ("icc-v4",), 1000),
    ("White balance", "Camera white balance as adaptation applied before capture is encoded, illuminant estimation as an ill-posed inverse problem, and grey-world and its descendants.", (), (), 1200),
    ("The dress", "A serious treatment of the 2015 photograph, because it is the best available demonstration that colour is an inference. The ambiguity is real, the two answers correspond to two different assumptions about the illuminant, and the image genuinely underdetermines the question.", (), ("lafer-sousa-2015",), 1400),
   ]},
 ]},

{"part": "IV", "title": "Pixels", "blurb":
 "Displays have finite levels, images have finite storage, and renderers have "
 "finite time. This part is about what happens when the continuous model of "
 "Parts I to III meets a discrete machine --- which is where colour theory "
 "turns into signal processing and stays there.",
 "chapters": [
  {"n": 12, "id": "ch12", "title": "Quantisation and Banding",
   "epigraph": "Eight bits is not enough, and has never been enough; the transfer function has been hiding it for you.",
   "source": None,
   "lead": "Banding is a quantisation artefact, and like all quantisation artefacts it is best understood as a signal-processing problem: a smooth signal, a coarse quantiser, and a viewer whose visual system happens to amplify exactly the kind of error a naive quantiser produces.",
   "sections": [
    ("Where the levels go", "Count them. How many distinguishable steps does 8-bit sRGB actually provide, where are they too coarse, and how does the transfer function redistribute them. The answer to 'why do gradients band in the shadows' is arithmetic, not mysticism.", (), ("poynton-video",), 1400),
    ("Mach bands and why the eye finds edges", "Lateral inhibition means the visual system differentiates. A quantiser produces step discontinuities. Those two facts multiply, which is why banding is far more visible than its amplitude suggests.", (), (), 1200),
    ("Bit depth, and where to spend it", "10-bit, 12-bit, half-float. What HDR requires, and the specific argument for why PQ at 10 bits beats sRGB at 10 bits over the same range.", (), ("itu-bt2100",), 1100),
    ("Dither as noise shaping", "Reframe: dithering adds noise before quantising in order to decorrelate the error from the signal. This is the same trick as in audio, and stating it that way makes every later algorithm a question about the *spectrum* of the added noise.", ("dither-methods",), ("ulichney-1993-void",), 1400),
   ]},
  {"n": 13, "id": "ch13", "title": "Dithering",
   "epigraph": "You are trading spatial resolution for amplitude resolution. The only question is which frequencies you pay in.",
   "source": None,
   "lead": "Four families of algorithm, one criterion. Because the eye is a low-pass filter, error at high spatial frequency is nearly free and error at low frequency is expensive. Every dithering method is a different attempt to push the error upward in frequency.",
   "sections": [
    ("Ordered dithering", "The recursive Bayer construction, why it tiles, and its defect: a Bayer matrix has strong low-frequency content, which is exactly the energy the eye is most sensitive to. Derive the matrix rather than tabulating it.", ("dither-methods",), (), 1300),
    ("Error diffusion", "Floyd-Steinberg, Jarvis-Judice-Ninke, Atkinson, Sierra. Serpentine scanning, the worm artefact, and Atkinson's deliberate choice to discard a quarter of the error.", ("dither-methods",), ("floyd-steinberg-1976",), 1500),
    ("Blue noise", "Void-and-cluster, what 'blue' means spectrally, and why a precomputed mask beats error diffusion for anything that has to be evaluated per-pixel in parallel. The GPU argument.", ("dither-methods",), ("ulichney-1993-void",), 1500),
    ("Measuring it properly", "The measurement trap: per-pixel error *rises* when you dither. Only after a low-pass filter --- the eye's, approximated by a Gaussian --- does the ordering invert. Give the numbers, and note that a paper reporting raw RMSE for a dithering method is reporting the wrong thing.", ("dither-methods",), (), 1200),
    ("Doing it in the right space", "Diffusing error in gamma-encoded values distributes it unevenly in light. Show the difference, which is visible in the midtones and is one of the more satisfying one-line fixes in this book.", (), (), 1000),
   ]},
  {"n": 14, "id": "ch14", "title": "Palettes",
   "epigraph": "Choosing k colours is a clustering problem. Choosing k *distinguishable* colours is a packing problem. They are not the same problem and they do not have the same answer.",
   "source": None,
   "lead": "Two questions that look alike. Reducing an image to k colours is clustering, and the answer depends entirely on the metric. Designing k colours that a reader can tell apart is sphere packing under a perceptual metric with constraints, and the constraints are where the interesting work is.",
   "sections": [
    ("Median cut and octrees", "Heckbert's algorithm, its speed, and its characteristic bias. Octree quantisation as the streaming alternative. Both operate on RGB, which is the problem.", (), ("heckbert-1982-color",), 1300),
    ("k-means in a perceptual space", "The same clustering with a metric that means something, and a demonstration of how much the choice of space changes the result. k-means++ seeding, and determinism as a requirement for reproducible builds.", (), ("ottosson-oklab",), 1200),
    ("Sequential and diverging ramps", "What a colourmap for continuous data owes the reader: monotone lightness above all, so that it survives greyscale printing and so that the data's ordering is visible to a dichromat. Why the rainbow map fails all of this and why it persists.", (), ("moreland-diverging",), 1500),
    ("Categorical palettes", "Farthest-point sampling under a perceptual metric, and the key move: measure separation as the *worst case* across normal vision and each deficiency, so that a pair which only survives trichromacy is rejected during generation rather than caught in review.", ("cvd-simulation",), ("brettel-1997-computerized",), 1600),
    ("The constraint nobody mentions", "Beyond about four entries, hue alone cannot separate a palette for a dichromat, because dichromacy collapses the hue circle to roughly one dimension. Lightness must do the work. Derive the number, and note that the book's own figure palette was generated under exactly this constraint.", ("cvd-simulation",), ("brettel-1997-computerized",), 1200),
   ]},
  {"n": 15, "id": "ch15", "title": "Ink",
   "epigraph": "Every model so far has assumed the colour arrives as light. Half the colour in the world arrives as the light that was left over.",
   "source": None,
   "lead": "Additive mixing is the easy case: two lights add, and the arithmetic is linear. A surface does not add anything. It removes, multiplicatively, and then the ink sits in a layer with thickness and scatter and a substrate underneath. This chapter is the one place the book leaves the comfort of a three-by-three matrix, and it is the reason CMYK is not a colour space.",
   "sections": [
    ("Subtractive mixing is multiplication", "Reflectance multiplies where radiance adds. Derive why that makes the arithmetic non-linear in any tristimulus coordinate, and why two inks that each look fine can overprint to mud.", (), ("wyszecki-stiles",), 1400),
    ("Why CMYK is not a colour space", "CMYK is a set of *instructions to a device*, not a coordinate system: the same four numbers mean different colours on different presses, papers and screening. There is no CMYK-to-RGB matrix and there never can be, which is why the conversion needs a measured profile.", (), ("icc-v4",), 1500),
    ("Black, and why there are four inks", "Grey component replacement and under-colour removal. Three inks can in principle make black; the reasons they do not are register, ink load, drying and cost --- and the resulting choice of how much K to substitute is a genuinely free parameter with visible consequences.", (), ("icc-v4",), 1300),
    ("Halftones and dot gain", "The screening problem is Chapter 13's dithering problem with physics attached: ink spreads. Amplitude-modulated versus frequency-modulated screening, and why FM screening is blue noise under another name.", (), ("ulichney-1993-void",), 1400),
    ("Spot colours and the limits of process", "Why Pantone exists, what a spot colour buys that four-colour process cannot, and what happens to brand colours that live outside CMYK.", (), (), 1000),
    ("Profiling a press", "Measurement, the characterisation target, and the fact that a print pipeline is the one place in this book where the only honest answer is to go and measure the device.", (), ("icc-v4", "cie-15-colorimetry"), 1200),
   ]},

  {"n": 16, "id": "ch16", "title": "Colour in the Rendering Pipeline",
   "epigraph": "A renderer is a machine for adding up light. Feed it code values and it adds up the wrong thing, very fast, in parallel.",
   "source": None,
   "lead": "Real-time and offline rendering are where every idea in this book has to be made cheap. The pipeline has a specific shape --- decode, work in scene-linear, tone-map, encode --- and almost every rendering artefact with a colour flavour comes from doing one of those steps in the wrong place.",
   "sections": [
    ("Texture encoding and hardware sRGB", "Why sRGB texture formats exist, what the hardware actually does, and the specific bug of filtering an sRGB texture without the sRGB flag: the GPU interpolates code values and the result is dark.", (), ("poynton-video",), 1400),
    ("Scene-linear working spaces", "Why ACEScg rather than linear sRGB: negative values, wide-gamut light sources, and the fact that a renderer's intermediate values are radiance, not colour.", (), ("aces-system",), 1200),
    ("Tone mapping", "The problem statement: map an unbounded radiance range onto a bounded display. Reinhard, filmic curves, and the ACES output transform as three points on a spectrum from arbitrary to principled. What each does to hue.", (), ("aces-system",), 1700),
    ("Colour in shaders", "Practical rules: what to store, when to decode, why to do lighting in linear and grading in a perceptual space, and the cost of an Oklab conversion in a fragment shader --- with the actual instruction count.", (), (), 1300),
    ("The output chain", "Swapchain formats, display profiles, HDR metadata, and the depressing gap between what an application asks for and what the compositor does.", (), ("itu-bt2100",), 1100),
   ]},
 ]},

{"part": "V", "title": "People", "blurb":
 "The model in Parts I to IV describes a standard observer who does not exist. "
 "This part is about the actual distribution of human vision, about what the "
 "model owes to readers it was not built for, and about the limits of the "
 "whole enterprise.",
 "chapters": [
  {"n": 17, "id": "ch17", "title": "Colour Vision Deficiency",
   "epigraph": "A dichromat's visual system is not a filtered version of yours. It is a projection onto a plane, and the plane is computable.",
   "source": None,
   "lead": "Around eight percent of men have some form of colour vision deficiency. Simulating it correctly is not a matter of desaturating the red channel; it is a well-defined geometric operation in cone space, and once you have it, designing for it becomes an optimisation problem rather than a guess.",
   "sections": [
    ("The genetics and the numbers", "L, M and S cone opsins, why the L and M genes sit adjacent on the X chromosome and recombine, and where the prevalence figures come from. Anomalous trichromacy versus dichromacy, and why the former is more common and less discussed.", (), ("stockman-2000-spectral",), 1300),
    ("Confusion lines", "The geometry: a dichromat's confusions are straight lines in chromaticity meeting at a copunctal point --- the missing cone's own chromaticity. Derive this, because it makes everything else obvious.", (), ("brettel-1997-computerized",), 1400),
    ("The Brettel projection", "Build the simulation properly: project onto two half-planes hinged on the neutral axis, anchored at two specific wavelengths. Derive the half-planes from the measured cone fundamentals rather than copying a matrix, and be explicit about which LMS basis is being used and why the choice matters.", ("cvd-simulation",), ("brettel-1997-computerized", "stockman-2000-spectral"), 1800),
    ("Anomalous trichromacy", "Why linear interpolation between normal and dichromatic vision is a convenience rather than a model, what Machado's approach does instead, and how much confidence any of it deserves.", (), ("machado-2009-cvd",), 1000),
    ("Designing for it", "Practical consequences: redundant encoding, the lightness constraint from Chapter 14, testing under simulation as part of a build rather than as an audit, and the specific failure of red-green status indicators.", ("cvd-simulation",), (), 1300),
   ]},
  {"n": 18, "id": "ch18", "title": "Contrast, Legibility and the Standards",
   "epigraph": "WCAG 2's contrast ratio is a formula from 1988 wearing the clothes of a legal requirement.",
   "source": None,
   "lead": "Text has to be readable. The web has a mandated formula for deciding whether it is, the formula is known to be wrong in specific and predictable ways, and it is nonetheless load-bearing in law and procurement. Treat this carefully and fairly.",
   "sections": [
    ("The WCAG 2 formula", "Where the (L1+0.05)/(L2+0.05) ratio comes from, what the 0.05 is doing, and what the 4.5:1 threshold was calibrated against.", (), ("wcag-2",), 1100),
    ("Where it fails", "Two documented failure modes: it is roughly symmetric under polarity inversion when perception is not, so dark-mode pairs are systematically mis-scored; and it ignores font size and weight beyond a single coarse threshold. Show pairs that pass and are unreadable, and pairs that fail and are fine.", (), ("wcag-2", "apca"), 1500),
    ("APCA and the successor problem", "What a perceptually-grounded replacement looks like, why it is polarity-aware, and the standards-politics reality that a better formula must also be adoptable.", (), ("apca",), 1300),
    ("Contrast beyond text", "Non-text contrast, focus indicators, charts, and the fact that most contrast guidance assumes a large uniform patch on a uniform ground, which describes almost nothing in a real interface.", (), ("wcag-2",), 1000),
    ("Dark mode as a colour problem", "Why a naive inversion fails: pure black backgrounds, halation with saturated text, and the fact that the eye's adaptation state differs between the two modes so the same ratio does not mean the same thing.", (), (), 1200),
   ]},

  {"n": 19, "id": "ch19", "title": "What Three Numbers Cannot Hold",
   "epigraph": "In visual perception a color is almost never seen as it really is \\u2014 as it physically is. \\#todo[verify wording against the 1963 first edition]",
   "source": "Josef Albers, Interaction of Color, 1963",
   "lead": "The model this book has built is powerful and finite, and the honest close is to say where it stops. Not as an apology --- the model earns its keep on every page before this one --- but because a reader who knows its boundary can tell the difference between a question it answers badly and a question it does not answer at all.",
   "sections": [
    ("Colour is contextual, and the model is not", "Simultaneous contrast, the Cornsweet illusion, White's illusion, and the checker-shadow. A tristimulus value is a property of a stimulus; a percept is a property of a scene. Everything in Parts I to IV computes the first and is routinely read as the second.", (), ("fairchild-appearance", "lafer-sousa-2015"), 1600),
    ("Naming, and whether it changes seeing", "Berlin and Kay's sequence, the Himba and Russian blues experiments, and a careful account of what the linguistic-relativity evidence actually supports --- which is a reliable but small effect on discrimination speed, not a different visual world.", (), (), 1700),
    ("Colour as meaning", "Warning red, mourning white, the fact that 'blue' is a young word in many languages and that Homer's sea was wine-dark. None of this is in the three numbers, and all of it governs what a colour does when you ship it.", (), (), 1400),
    ("What a better model would need", "An honest wish list: spatial context, temporal adaptation, material appearance beyond colour (gloss, translucency, texture), and individual variation. Point at where each is being worked on, and at how far away it is.", (), ("fairchild-appearance",), 1300),
    ("The case for the model anyway", "Close by earning the whole book back. Three numbers built every display, every camera, every print process and every image format you have ever used. A lossy model that is this useful is not a failure of ambition; it is what a successful abstraction looks like.", (), (), 1200),
   ]},
 ]},
]
