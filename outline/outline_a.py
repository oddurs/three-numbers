# Part I and II of the outline. Each section carries the argument it will make,
# not just a title: a heading with no thesis under it is not an outline.
OUTLINE = [
{"part": "I", "title": "Light", "blurb":
 "Before colour is a data type it is a physical signal and a biological "
 "measurement. This part builds the model from the bottom: a spectrum is a "
 "function, the eye is a three-channel projection of that function, and "
 "everything that follows in the book is a consequence of the fact that the "
 "projection throws almost all of it away.",
 "chapters": [
  {"n": 1, "id": "ch01", "title": "Light as a Signal",
   "epigraph": "A spectrum is a vector. Everything else in this chapter is that sentence with units attached.",
   "source": None,
   "lead": "Treat spectral power distributions as what they are --- elements of a function space --- and the operations that matter become familiar. Reflection is pointwise multiplication. Mixing lights is addition. Measurement is an inner product. The only unusual thing is that the space is infinite-dimensional and the measurements number three.",
   "sections": [
    ("Spectral power distributions", "Define the SPD, its units, and the difference between radiometric and photometric quantities --- the distinction that makes 'brightness' ambiguous and 'luminance' precise. Introduce the repository's `Spectrum` type as a uniformly sampled function and be explicit about what sampling costs. Open with the visible band itself, and with the fact that no display has ever shown the reader a single wavelength.", ("visible-spectrum",), ("cie-15-colorimetry",), 1500),
    ("Black bodies and Planck's law", "Derive the thermal spectrum, in enough detail that the reader sees where the constants come from, and show that colour temperature is a genuine physical parameterisation rather than a marketing term. Wien's law as the peak; the Planckian locus as the trajectory.", ("blackbody-spectra",), (), 1700),
    ("Real sources and their spectra", "Daylight, tungsten, fluorescent, LED. The key contrast: thermal sources are smooth, and everything else is spiky. Narrow-band sources are why two paints can match in a shop and not in a car park.", (), ("cvrl-database",), 1300),
    ("Reflectance, transmittance, and the surface", "Pointwise multiplication, and why 'the colour of an object' is a category error that we get away with because daylight is smooth and broadly flat.", (), (), 1000),
    ("Standard illuminants", "Why the CIE had to standardise light before it could standardise colour. D65, A, E, and the daylight locus as a cubic fit to measured sky. Note that the engine computes the illuminant A white point from its published SPD and lands within 0.0005 of the published chromaticity --- a small demonstration that the tables are consistent.", (), ("cie-15-colorimetry", "cvrl-database"), 1200),
   ]},
  {"n": 2, "id": "ch02", "title": "Three Numbers",
   "epigraph": "the Rays to speak properly are not coloured. In them there is nothing else than a certain Power and Disposition to stir up a Sensation of this or that Colour. \\#todo[verify wording against the 1730 fourth edition]",
   "source": "Isaac Newton, Opticks, 1704",
   "lead": "This is the pivot of Part I. Three cone types, three inner products, one 3-vector. From that single fact derive Grassmann's laws, the existence of metamers, and the reason colour arithmetic is linear at all --- which is the property that makes every matrix in the rest of the book legitimate.",
   "sections": [
    ("Cones as inner products", "The L, M and S fundamentals from Stockman and Sharpe, plotted from the measured data. Emphasise the overlap between L and M: they are far more similar than intuition suggests, which is why red-green deficiency is common and blue-yellow is rare.", (), ("stockman-2000-spectral", "cvrl-database"), 1400),
    ("Grassmann's laws and why colour is linear", "State the laws as the empirical claim that colour matching is a linear map, note that this is a *contingent experimental fact* rather than a necessity, and note where it breaks down --- very low light, very high saturation, very small fields.", (), (), 1200),
    ("Metamerism, constructed", "Build a metamer explicitly by solving a 3x3 system rather than by searching: pick three emission lines, solve for the weights that reproduce a target's tristimulus values, and observe that the answer is exact and the spectra share nothing. Distinguish illuminant metamerism, observer metamerism, and geometric metamerism, and note which one ruins car paint.", ("metamer-pair",), ("cie-15-colorimetry",), 1800),
    ("The null space, and what lives in it", "Formalise: the set of spectra invisible to the eye is a closed subspace of enormous dimension. Fundamental metamers and the black-metamer decomposition. This is the cleanest statement of what colour vision discards.", (), ("wyszecki-stiles",), 1300),
    ("Rods, and the part of the model we are ignoring", "Scotopic vision, the Purkinje shift, and an honest statement that this book assumes photopic conditions throughout and that mesopic vision is a genuinely unsolved practical problem.", (), (), 800),
   ]},
  {"n": 3, "id": "ch03", "title": "The Standard Observer",
   "epigraph": "the science of colour must be regarded as essentially a mental science. \\#todo[verify wording and source]",
   "source": "James Clerk Maxwell, 1872",
   "lead": "The CIE 1931 observer is the most consequential set of three curves in engineering, and it is usually presented as a measurement. It is not: it is a measurement followed by a change of basis chosen for convenience, and both halves matter.",
   "sections": [
    ("The colour matching experiment", "Wright and Guild's apparatus, the bipartite field, and the moment where the experiment fails: some test wavelengths cannot be matched, and the subject must add primary light to the *test* side. That is where the negative lobes come from, and it is a fact about the primaries, not about the eye.", (), ("wyszecki-stiles",), 1500),
    ("From RGB to XYZ: choosing a basis", "The 1931 transformation as a deliberate design: make all three functions non-negative, make one of them exactly V(lambda), put the white point somewhere convenient. Show the matrix, and stress that a different committee could have chosen differently and nothing physical would change.", ("colour-matching-functions",), ("cie-15-colorimetry",), 1700),
    ("Imaginary primaries", "The price of non-negativity is that X, Y and Z are not lights. No lamp emits the X primary. Readers who find this uncomfortable should be reassured that it is the same discomfort as a basis vector outside a convex cone, and no more.", (), (), 900),
    ("Integrating a spectrum into tristimulus values", "The practical recipe, the k normalisation for reflecting surfaces, and the numerical care that sampling at 5 nm versus 1 nm actually requires for spiky sources.", (), ("cie-15-colorimetry",), 1200),
    ("Which observer?", "1931 2 degrees, 1964 10 degrees, Judd-Vos, CIE 2006. What differs, by how much, and when it matters. The uncomfortable fact that the standard everything is built on is known to be wrong in the blue and is kept anyway, because compatibility beats accuracy.", ("colour-matching-functions",), ("cvrl-database", "cie-15-colorimetry"), 1400),
   ]},
 ]},

{"part": "II", "title": "Spaces", "blurb":
 "Given three numbers, choose coordinates. This part is a tour of the "
 "coordinate systems the industry actually uses, each presented as what it is: "
 "a set of choices, made for reasons, with consequences. By the end the reader "
 "should be able to derive any RGB matrix from first principles and to say "
 "precisely what is wrong with HSL.",
 "chapters": [
  {"n": 4, "id": "ch04", "title": "Chromaticity and Its Shadows",
   "epigraph": "The horseshoe is a shadow. Almost every claim people make by pointing at it is a claim about the shadow.",
   "source": None,
   "lead": "Normalise away intensity and two dimensions remain. The resulting diagram is the most recognisable image in the field and the most abused: it is a projective picture, distances in it mean nothing, and the areas people compare on it are not the quantities they think they are comparing.",
   "sections": [
    ("Projecting out intensity", "x = X/(X+Y+Z). A perspective projection from the origin onto a plane, and therefore a projective map: straight lines are preserved, which is why additive mixtures lie on chords, and *nothing else is*.", ("cie-1931-chromaticity",), ("cie-15-colorimetry",), 1200),
    ("Reading the diagram correctly", "What the locus is, what the line of purples is and why it has no wavelength, where white sits and why that is a choice, and what the interior colours in every printed version of this diagram actually are --- which is: made up, because the page cannot show them.", ("cie-1931-chromaticity",), (), 1400),
    ("Distances that lie", "MacAdam's ellipses: the discrimination threshold varies by an order of magnitude across the diagram. Therefore any statement of the form 'these two colours are close on the chromaticity diagram' is unfounded, and the widespread practice of comparing gamut *areas* on it is worse.", (), ("macadam-1942-visual",), 1600),
    ("u'v' and the partial repair", "The 1976 UCS transform as a projective correction. It makes the ellipses rounder and is still not uniform. Useful as a lesson in how far a linear-fractional fix can take you.", (), ("cie-15-colorimetry",), 1000),
    ("Dominant wavelength, purity, and colour temperature", "The quantities people actually want from this diagram, defined properly, plus correlated colour temperature and why a single number for 'how blue is this white' requires a metric that the diagram does not have.", ("blackbody-spectra",), (), 1300),
   ]},
  {"n": 5, "id": "ch05", "title": "Building an RGB Space",
   "epigraph": "Three primaries, a white point, and a curve. That is the whole contents of an RGB colour space, and two of the three are usually mis-stated.",
   "source": None,
   "lead": "Derive the sRGB matrix from scratch in four lines of linear algebra, then show that every other RGB space differs only in which numbers you feed the same derivation. The matrices everyone copies off web pages are outputs, not inputs.",
   "sections": [
    ("The derivation", "Each primary fixes a direction in XYZ; the white point fixes the three scale factors that put (1,1,1) on white. Solve, and you have the matrix. Derive it, print it, compare to the published table.", (), ("css-color-4",), 1500),
    ("The two sRGB matrices", "A short, satisfying detective story. The widely-copied matrix and the CSS Color 4 matrix differ in the fourth decimal because one derives D65 from xy and the other quotes it rounded to XYZ. Neither is wrong; the disagreement is the interesting object, and the engine reproduces both on demand.", (), ("css-color-4",), 1100),
    ("Luminance weights are not a perceptual constant", "0.2126, 0.7152, 0.0722 falls out of where Rec.709's primaries happen to sit. Change the primaries and the weights change. Every codebase that hard-codes these and then switches to P3 has a bug.", (), ("poynton-video",), 900),
    ("A tour of the spaces", "sRGB, Display P3, Rec.2020, Adobe RGB, ProPhoto, ACEScg, ACES2065-1 --- what each was built for and what each gave up. ProPhoto's imaginary primaries and ACES AP0's deliberate enclosure of the entire locus as two solutions to the same problem.", ("cie-1931-chromaticity",), ("css-color-4",), 1700),
    ("Gamut volume, measured honestly", "Replace the area-on-a-chromaticity-diagram habit with a Monte Carlo volume in Oklab, and give the numbers. Note how much smaller the difference between sRGB and P3 is than the marketing suggests, and how much of Rec.2020 no display can reach.", ("oklch-gamut-slice",), (), 1300),
   ]},
  {"n": 6, "id": "ch06", "title": "The Transfer Function",
   "epigraph": "The single most expensive misunderstanding in graphics is that a pixel value is an amount of light.",
   "source": None,
   "lead": "Between a stored number and an emitted photon sits a nonlinear curve. It exists for two unrelated reasons --- a physical accident of cathode ray tubes and a genuine perceptual argument about coding efficiency --- and conflating those two reasons is how the folklore got so confused.",
   "sections": [
    ("Why there is a curve at all", "The CRT's power law, the happy coincidence that its inverse resembles perceptual lightness, and the resulting efficient allocation of code values. Modern displays have no such physics and emulate the curve anyway, for compatibility.", (), ("poynton-video",), 1400),
    ("sRGB is not gamma 2.2", "Show the two curves, show the error, and be precise about where it matters: about two percent through the midtones, and catastrophic in the deep shadows where the linear toe lives. Name the bug this causes.", ("transfer-functions",), ("css-color-4",), 1500),
    ("The half-grey problem", "Work the canonical example all the way through. 128 is not half of 255 in any sense that matters; the light is about 21.4 percent. Then show the consequences: image downscaling, alpha blending, antialiasing and blur all performed in the wrong space, with the same characteristic darkening.", (), ("poynton-video",), 1700),
    ("Linear workflows", "What it actually means to 'work in linear': where to decode, where to encode, what to store, and why a 16-bit or float buffer is not optional once you decode. The precision argument, quantitatively.", (), (), 1300),
    ("High dynamic range", "PQ and HLG. PQ as the first transfer function in this book derived from a perceptual model rather than from hardware, absolute versus relative encoding, and why HDR forces the question 'how bright is white' to have a real answer.", ("transfer-functions",), ("itu-bt2100", "smpte-st2084"), 1600),
   ]},
  {"n": 7, "id": "ch07", "title": "Perceptual Spaces, and the Cylinders on Top of Them",
   "epigraph": "CIELAB was built so that Euclidean distance would mean something. Chapter 9 is the story of how badly that went.",
   "source": None,
   "lead": "XYZ is linear and useless for judgement; RGB is device-bound. A perceptual space is an attempt to warp tristimulus space so that geometry matches experience. This chapter presents those attempts in order, then the cylindrical coordinates the industry actually ships on top of them --- because the gap between the two is where most interface colour bugs live.",
   "sections": [
    ("What 'uniform' would mean", "Define the goal precisely --- equal distances should be equally noticeable --- and note immediately that this is a strong claim about a metric space and that no such space exists exactly.", (), ("fairchild-appearance",), 900),
    ("CIELAB", "The cube root as a compressive nonlinearity, the linear segment near black and why it is there, the opponent axes, and the relationship between L* and luminance. Derive why L* = 50 is not half the light.", (), ("cie-15-colorimetry",), 1600),
    ("CIELUV and the road not taken", "The alternative that kept a projective chromaticity diagram, why the television industry preferred it, and why it lost.", (), ("cie-15-colorimetry",), 700),
    ("Oklab", "A modern fit: same architecture as CIELAB, better cone matrix, better exponent, fitted against newer data. Show the matrices, note that it is a fit and not a theory, and show where it improves on CIELAB --- particularly the blue hue shift that CIELAB gets visibly wrong. Note also that its neutral axis misses sRGB's by about two parts in ten thousand, which is what being a fit costs.", (), ("ottosson-oklab",), 1600),
    ("The cylinders: HSL, HSV and how they are built", "Derive HSL and HSV from the gamma-encoded RGB cube geometrically, so the reader sees exactly what they are: max, min, and a hue angle determined by which face you are on. No perceptual data enters anywhere. Then give them a fair hearing --- they are cheap, they are in every picker, and for nudging one hue they are adequate.", (), (), 1300),
    ("Measuring the damage", "Sweep the hue circle at fixed HSL lightness and plot what three other models say. HSL reports a flat line; CIE L* swings by sixty units. Quantify it, and show what it does to a real interface.", ("lightness-comparison",), ("ottosson-oklab",), 1500),
    ("LCh, Oklch and HWB", "The replacements with the same ergonomics and a real metric underneath, plus the Ostwald-flavoured HWB. The one genuine difficulty: a cylindrical perceptual space has a gamut boundary that varies with hue, so a chroma slider cannot have a fixed range. That is a real cost and the chapter should not pretend otherwise.", ("oklch-gamut-slice",), ("css-color-4", "ottosson-oklab"), 1500),
    ("Appearance models, briefly", "CIECAM02 and CAM16 exist because a colour's appearance depends on the surround, the adapting luminance and the background, and none of the spaces above know any of that. Sketch the architecture, state what it buys, and be clear that most software will never use it.", (), ("fairchild-appearance",), 1100),
   ]},
 ]},
]

EXERCISES = {'ch01': [('Integrate the published D65 spectrum against the 1931 observer and recover its chromaticity. How far from the published (0.3127, 0.3290) do you land, and is the difference in the data or in your quadrature?', 'code', None), ("Wien's law puts a 2856 K black body's peak at about 1015 nm, well outside the visible band. Explain why illuminant A nonetheless looks yellow rather than dark red.", 'think', None), ('Take two light sources with the same correlated colour temperature — one Planckian, one a three-line LED. Show that CCT is not sufficient to predict how a surface will look under them.', 'code', 'You are constructing a pair of illuminant metamers.')], 'ch02': [('Construct a metamer for a given reflectance using four narrow lines instead of three. The system is now underdetermined: describe the solution space, and find the member of it with the smallest total power.', 'code', None), ('Prove that the set of spectra invisible to a trichromat is a linear subspace, and give its dimension for a spectrum sampled at 5 nm from 380 to 730 nm.', 'proof', None), ('Two paints match under D65 and diverge under illuminant A. Using only the definition of the tristimulus integral, explain why no choice of three-number colour space can prevent this.', 'think', None)], 'ch03': [('Derive the 1931 XYZ primaries from the Wright–Guild RGB matching data. Which constraints determine the transform uniquely, and which are free?', 'proof', None), ('Show that ȳ(λ) = V(λ) is a normalisation choice rather than a discovery, by constructing an equally valid XYZ-like basis in which it is not true.', 'proof', None), ("Integrate a narrow-band LED spectrum at 1 nm and at 5 nm sampling. How large is the disagreement, and how does it scale with the source's bandwidth?", 'code', 'Spiky sources are where abridged tables fail.')], 'ch05': [('Derive the Display P3 matrix from its primaries and white point, and confirm it against the published value to seven decimal places.', 'code', None), ('Quote D65 as the rounded triple (0.95047, 1, 1.08883) instead of deriving it from xy. Show that this reproduces the other sRGB matrix in circulation, and decide which you would ship.', 'code', None), ('A codebase hard-codes the luminance weights (0.2126, 0.7152, 0.0722) and then switches to Display P3. Compute the resulting error for a saturated green, and say whether anyone would notice.', 'code', None)], 'ch06': [('Find the encoded value V at which decoding sRGB as a pure 2.2 power law is exactly correct, and explain why there are two such values rather than one.', 'proof', None), ('Resize an image by half in encoded values and in linear light. Measure the mean luminance of each result against the original and explain the sign of the error.', 'code', None), ('PQ encodes absolute luminance. Work out what happens when PQ content mastered for 1000 cd/m² is shown on a 400 cd/m² display with no tone mapping.', 'think', None)]}
DIFFICULTY_NOTE = {'code': 'requires running code', 'proof': 'pencil and paper', 'think': 'no computation needed'}
