#import "../lib/book.typ": *

#chapter(
  6,
  epigraph: [The single most expensive misunderstanding in graphics is that a pixel value is an amount of light.],
)[The Transfer Function]

#lead[
  Between a stored number and an emitted photon sits a nonlinear curve. It exists
  for two unrelated reasons: a physical accident of cathode ray tubes, and a real
  perceptual argument about coding efficiency. Conflating them
  is how the folklore around it got so confused.
]

Everything in the previous chapter was linear. A colour space was three primaries,
a white point and a matrix, and the matrix was legitimate because colour matching
is additive: two lights that each produce a tristimulus vector produce, together,
the sum of those vectors. That is Grassmann's law, and every derivation in
Chapter 5 rested on it.
#marginnote[
  Grassmann's laws are the subject of §2.2. They are an empirical finding about
  colour matching, not a necessity, which is worth remembering whenever a derivation in
  this book leans on linearity.
]

None of it applies to the number stored in your framebuffer.

The byte `128` is not half of `255` in any sense that a photometer would
recognise. It is not half the radiance, not half the luminance, not half of
anything you can measure with an instrument. It is halfway along a scale whose
relationship to light is a curve, and the curve is steep in exactly the place
where most people assume it is straight. Add two such numbers and divide by two,
and you have computed the average of two positions on a nonlinear scale, which is
not the average of the two quantities the scale represents.

This chapter is about that curve: where it came from, why it is still here, what
it is exactly, and what breaks when you forget it is there.

== Why there is a curve at all

Start with the accident, because it came first.

A cathode ray tube works by accelerating electrons at a phosphor. The brightness
of the resulting spot depends on the beam current, and the beam current depends on
the voltage on the control grid, but not proportionally. In a space-charge-limited
electron gun the current goes roughly as the grid voltage raised to a power
somewhere between 2.2 and 2.5, and the luminance of the
phosphor follows the current closely enough that the whole chain, from input
voltage to emitted light, is a power law.
#sidenote[
  The word arrives from photography, where $gamma$ was the slope of a film's
  density-against-log-exposure curve. It was borrowed for the CRT's exponent by
  analogy, and the analogy has been causing trouble ever since.
]

#marginnote[
  The exponent is a property of the gun's geometry, not of the phosphor. Different
  tubes had measurably different exponents, which is one reason "gamma" became a
  parameter that broadcast engineers argued about rather than a constant.
]

So a CRT is a device that raises its input to a power of about 2.4 and
emits the result as light. If you want a picture to come out looking like the
scene that went in, something in the chain has to raise the signal to the
reciprocal power first. Television did this at the camera, in the 1930s, for the
economically decisive reason that cameras were few and receivers were many: put
the correction in the studio and every set in the country gets it for free.
#sidenote[
  Television therefore got a linear workflow backwards on purpose, seventy years
  before anyone argued about it: encode at capture, decode at display, and never
  mind that the intermediate signal is proportional to nothing. It worked because
  nothing in between did arithmetic.
]

#defn[Transfer function][
  The map between a stored or transmitted code value and a linear light quantity.
  It always comes as a pair, and the direction matters:

  - the *OETF*, the opto-electronic transfer function, goes from light to code and
    lives in the camera;
  - the *EOTF*, the electro-optical transfer function, goes from code to light and
    lives in the display.

  This book writes them as `encode` and `decode`, because "which way round is the
  OETF" is a question nobody should have to answer twice.
]

#trap[
  The word *gamma* is used for at least four different things: the exponent of the
  display's response, the exponent of the encoding applied to compensate for it,
  the operation of applying either, and the end-to-end exponent of the whole
  chain, which is deliberately not 1.0. More on that below. When you
  read that something "has gamma 2.2", establish which of the four is meant before
  you do anything with the number.
]

=== The coincidence that made it permanent

Had that been the whole story, the curve would have died with the CRT. LCDs and
OLEDs have no such physics; their native response is nothing like a power law, and
they emulate one in a lookup table purely so that the signal they are handed means
what it has always meant.

But something else was true, and it is the reason nobody wanted to get rid of the
curve even when the hardware stopped requiring it.

Human lightness perception is itself compressive. A light source of half the
luminance does not look half as bright; it looks perhaps three-quarters as bright.
Chapter 7 gives this its proper treatment, and CIELAB's $L^*$ is a cube root,
near enough. The shape is what matters here. The eye's response to luminance is
approximately a power law with an exponent near $1\/3$, and the CRT's inverse
is a power law with an exponent near $1\/2.4$.

Those two curves are not the same. They are close enough that the correction
signal a CRT needed turns out to be *approximately perceptually uniform*, and that
is an enormously useful accident. It means the code values are spent where the eye
can tell them apart, instead of being spread evenly over a quantity the eye is
wildly non-uniformly sensitive to.
#marginnote[
  Poynton's distinction is the one to keep: *luminance* is a physical quantity,
  and *luma* is the weighted sum of gamma-encoded components that video calls
  $Y'$. They are not the same, and the prime is not decoration. @poynton-video
]

#keyidea[
  Gamma encoding survives because it is a good perceptual code, not because
  displays still need it. It allocates scarce code values in proportion to the
  eye's ability to distinguish them, which is what a compression scheme is
  supposed to do.
]

How good a code? Take the 256 values available to an 8-bit channel and
ask, for each step, how much of a lightness difference it buys. Measured in
CIELAB $L^*$, where one unit is roughly one just-noticeable difference for a large
patch:

#listing(
  caption: [Perceptual step size for two ways of spending eight bits. Computed by
    `engine/color/transfer.ts`; the numbers in the text come from running it.],
)[
```
                  worst ΔL*    steps over
                   per step      ΔL* = 1
 8-bit  sRGB          0.509     0 of  255
 8-bit  linear        3.542    15 of  255
10-bit  linear        0.883     0 of 1023
12-bit  linear        0.221     0 of 4095
```
]

Eight bits of gamma-encoded value is *just* enough: the largest perceptual jump
between adjacent codes is about half a just-noticeable difference, and it occurs
around code 24, down in the near-blacks. Eight bits of linear light is
not close: fifteen of its steps exceed a just-noticeable difference, all of them
crowded into the bottom of the range, which is where banding is most
visible. To store linear light without visible quantisation you need ten bits at
minimum and twelve to be comfortable.

That is the whole argument for the curve, and it has nothing to do with cathode
rays.
#marginnote[
  The same argument, made with a better perceptual model and a far larger range,
  produces PQ, the last section of this chapter.
]

#sidenote[
  The end-to-end exponent of a broadcast chain is deliberately about 1.2
  rather than 1.0, because a picture viewed in a dim surround looks
  flatter than the original scene and needs the extra contrast to compensate. This
  is the *OOTF*, the third member of the family, and it is why a faithfully
  linear pipeline can still produce an image that looks wrong. @poynton-video
]

=== The curve assumes a room

One more thing travels with a transfer function, and it is routinely dropped: the
viewing conditions it was defined for.

sRGB does not merely specify a curve. It specifies a reference display at
#qty(80, [cd\/m#super[2]]) white luminance, a surround reflectance of 20 per cent,
and an ambient illumination of 64 lux: a dim office, neither a bright one nor a
darkened grading suite. @iec-61966-2-1 The curve is the right curve under those
conditions and not otherwise.

This matters because contrast perception depends on the state of adaptation. The
same image shown in a dark room looks flatter than it does in a dim one, which is
why cinema uses a 2.6 gamma where television uses 2.4, and why the end-to-end
response of a broadcast chain is deliberately about 1.2 rather than unity. A
system that reproduced scene luminances exactly would look wrong, and the extra
contrast is there to compensate for the surround.

#keyidea[
  A transfer function is a claim about a display *in a room*. Reproducing the
  numbers faithfully while ignoring the viewing conditions is a different kind of
  error from getting the arithmetic wrong, and no amount of precision fixes it.
]

That third curve is the OOTF, the opto-optical transfer function, and it is why
a pipeline can be numerically perfect and still produce an image a colourist
rejects on sight.

== sRGB is not gamma 2.2

Now the specifics, because this is where the folklore does damage.

sRGB's transfer function is *piecewise*. It is not a power law. Below a linear
value of 0.0031308 it is a straight line of slope 12.92; above
it, a power law with exponent $1\/2.4$, scaled and offset so the two pieces meet
with matching value and slope: @iec-61966-2-1

$ V = cases(
  12.92 L & "if " L <= 0.0031308,
  1.055 L^(1\/2.4) - 0.055 & "otherwise"
) $

The linear segment exists because a pure power law has infinite slope at zero. In
the encoder that means unbounded gain on sensor noise in the deepest blacks; in
fixed-point arithmetic it means the first few code values are unreachable. The toe
replaces that singularity with a finite slope, and it costs almost nothing: the
breakpoint sits at encoded value 0.04045, which in eight bits is code
10.31, so the straight part of sRGB occupies eleven of the
256 available code values and is invisible for every other purpose.
#sidenote[
  0.0031308 is not a round number because it is not chosen: it falls out of
  requiring the two pieces to meet with matching value *and* matching slope,
  given the exponent and the scale factor. Exercise 3 recovers it.
]

#fig("transfer-functions")

Now: how wrong is it to treat the whole thing as $L^(1\/2.2)$?

Through the midtones, barely wrong at all. Decoding sRGB with a 2.2
power law over-estimates the light by a peak of 2.04 per cent, near
encoded value 0.60. Two per cent is below the threshold at which anyone
will notice anything, and it is the reason the approximation has survived: every
test you are likely to run on it passes.
#marginnote[
  Which is the general shape of the problem. An approximation that fails loudly
  gets fixed; one that fails only in the shadows gets shipped.
]

Below encoded value 0.389 the sign flips and the error grows without
bound. At encoded value 0.04, which is 8-bit code 10 and just inside the
toe, the power law returns 73 per cent *less* light than is there. It does not return a slightly wrong shadow; it returns about a quarter of
the shadow.

#trap[
  This is not a rounding difference. In the bottom eleven code values the two
  functions disagree by more than a factor of three, and those code values are
  exactly where banding, crushed blacks and the muddy edges of a drop shadow live.
  If your shadows look wrong and your midtones look fine, suspect this first.
]

It is worth being precise about what the approximation is *for*. If you must
approximate sRGB with a single exponent, 2.2 is not even the best one:
fitting a pure power law to the true curve over the whole range gives an exponent
of 2.223, with a maximum absolute error of about 0.005 in
linear light. The commonly quoted figure of 2.2 describes the *shape* of
the sRGB curve considered as a whole, which is a different thing from the
exponent 2.4 that appears in its definition. Both numbers are correct
about different things, which is how they came to be used interchangeably.

#aside(title: "Rec.709 is not sRGB either")[
  The two share primaries and a white point, and differ in their curve. Rec.709
  specifies a camera OETF, $4.5 L$ below 0.018 and
  $1.099 L^(0.45) - 0.099$ above, which is the encoding side of a system whose
  decoding side is the CRT's 2.4 exponent, giving the end-to-end
  1.2 mentioned earlier.

  sRGB's curve is an *EOTF written backwards*: it describes the display, not the
  camera. Treating one as the other is a real production bug and produces a
  characteristic lift in the blacks.
]

== The half-grey problem

Here is the canonical example, worked all the way through, because every bug in
the rest of this section is the same bug wearing different clothes.

Take two pixels: one black, one white. In eight bits they are 0 and
255. Average them the obvious way and you get 128.

Now ask what that means in light. Decode it:

$ "decode"(128\/255) = 0.2159 $

Twenty-two per cent. But the correct answer, the average of the two *luminances*,
which is what a camera pointed at a fine black-and-white checkerboard would
measure, and what your eye does when the checks are too small to resolve, is

$ (0 + 1) \/ 2 = 0.5 $

Fifty per cent. To emit half the light, the code value must be

$ "encode"(0.5) times 255 = 187.5 approx 188 $

#fig("half-grey")

The naive average is wrong by a factor of 2.34 in luminance, and it is
wrong in the same direction every time: too dark. That directionality is what
makes it so recognisable once you know to look. Every operation below is an
average of some kind, and every one of them darkens.

=== Where it shows up

*Downscaling an image.* A thumbnail is a weighted average of neighbouring pixels.
Perform it on code values and every region of fine detail (foliage, hair, a
striped shirt, text) comes out darker than the original. The classic
demonstration is a full-resolution image of alternating black and white lines: the
correct thumbnail is mid-grey, and the naive one is nearly black.

Work it through. A row alternating black and white, halved in size, produces a
row in which every output pixel averages one black and one white input. In code
values that is 128, which emits 21.4 per cent of the white. The true average is
50 per cent. Every pixel of the output is well under half the brightness it
should be, and the image as a whole has lost more than a stop.

Worse, mipmap chains compound it. Each level averages the level above, and each
average is wrong in the same direction, so a texture sampled at a distance in a
naive renderer is not slightly dark. It is progressively dark, and the darkening
tracks the camera. That is why distant foliage in older games went black as you
walked away from it.

#marginnote[
  Hence the artist's workaround of brightening distant textures by hand, which
  fixes the symptom at one distance and breaks it at every other.
]

*Alpha compositing.* Blending a source over a destination at 50 per cent
opacity is an average with weights. Done in code values, a white logo at half
opacity over a black background produces 128 instead of 188,
and the logo looks unaccountably dim. Chapter 8 takes this apart properly, along
with the separate question of premultiplication.

*Antialiasing.* A pixel half-covered by a black glyph on white should emit half
the light. Rasterisers that compute coverage correctly and then apply it to code
values produce text that is too heavy, which is why so much font rendering has a
fudge factor applied to the coverage value, compensating for one error with
another.

*Blur, bloom, depth of field, mipmaps, and every convolution kernel you have ever
written.* All averages. All wrong by the same mechanism.

#sidenote[
  A useful diagnostic: the error is largest where local contrast is highest and
  vanishes on flat colour. If a bug shows up in detailed regions and nowhere
  else, it is almost certainly this one.
]

#keyidea[
  If an operation is a weighted average of two colours, it belongs in linear
  light. This covers resizing, blending, antialiasing, blurring, mipmapping and
  compositing, which is to say most of what a renderer does.
]

=== Doing it right

The fix is three lines and never gets harder:

#listing(caption: [Averaging two channel values correctly. `decode` and `encode`
  are the sRGB pair given in the previous section.])[
```ts
const average = (a: number, b: number): number =>
  encode((decode(a) + decode(b)) / 2);

average(0, 1);        // 0.7354 -> 8-bit 188, not 128
```
]

The cost is two transcendental functions per sample, which matters in a tight loop
and is the honest reason the wrong version is so widespread. The usual answers are
a lookup table for 8-bit input, a cheap approximation such as averaging the
squares, or, in a GPU pipeline, asking the hardware to do it, which it will,
for free, if you tell it the texture is sRGB. Chapter 16 covers that machinery.

#marginnote[
  A lookup table is the usual answer for 8-bit input: 256 entries, computed once,
  and the decode becomes an array index. There is no excuse for the slow version
  in an inner loop.
]

#aside(title: "A test you can run in a minute")[
  Make an image of one-pixel alternating black and white lines. Scale it to half
  size in whatever tool you are evaluating. If the result is mid-grey, the tool
  works in linear light. If it is dark grey or black, it does not.

  Almost nothing passes by default.
]

=== Telling whether you have it

Three tests, in ascending order of how much they tell you.

+ *The line test above.* Scale the striped image and look. It answers yes or no
  and nothing else, which is often all you need.
+ *The ramp test.* Render a gradient from black to white and measure the code
  value at its midpoint. A correct linear-light ramp reads 188; a naive one reads
  128. This also catches a pipeline that decodes twice, which reads far lower.
+ *The checkerboard match.* The figure above, with your own rendering stack in
  the loop. Composite 50 per cent white over black and compare it against the
  checkerboard. If they match, the compositor is right; if the composite is
  darker, it is averaging code values.

None of these needs a photometer, and all three take a minute.

== Linear workflows

"Work in linear" is advice repeated often enough to have become a slogan, which
means it is worth saying exactly what it involves.

A pipeline has three parts. At the input, every asset is decoded from whatever
encoding it arrived in. In the middle, all arithmetic happens on linear values. At
the output, the result is encoded for the display it is going to. The rule is that
the decode happens *once*, as early as possible, and the encode happens *once*, as
late as possible, and nothing in between ever sees a code value.

The mistakes are all about the boundaries:

/ Decoding twice: An asset that was already linear gets decoded again, which
  darkens it. Common when two subsystems each believe they own the conversion.
/ Forgetting the encode: The linear result is written straight to an 8-bit
  buffer. Produces a washed-out, milky image: the opposite of the usual
  darkening, and therefore diagnostic.
/ Decoding data that is not colour: Normal maps, roughness maps, masks, height
  fields and alpha channels are *not* light. They carry numbers that happen to be
  stored in an image format. Decoding them applies a curve to a quantity that has
  no business being curved, and the results are subtle and awful.

#trap[
  The rule of thumb that catches most of these: if the value would still mean
  something when the lights go out, it is data, and it must not be decoded.
]

The distinction to hold is between a texture that carries *light* and one that
carries *data*. An albedo map is light: it says how much of each band a surface
reflects, and it must be decoded. A roughness map is a number between zero and
one that indexes into a reflectance model; applying a transfer function to it
changes the material, and does so in a way that looks almost right, which is the
worst available failure mode.

The same reasoning applies at the far end. A depth buffer, a motion vector field,
an ambient-occlusion term and an ID mask are all stored in image formats and none
of them is colour. The format cannot tell them apart, which is why the pipeline
has to.

#trap[
  Alpha is not colour. It is a coverage fraction, and it is already linear.
  Applying a transfer function to an alpha channel is a bug that survives review
  because the image still looks approximately right.
]

=== You cannot stay in eight bits

The precision table earlier in this chapter is not an aside; it is a constraint on
the architecture. Decoding to linear and storing the result in the same 8-bit
buffer throws away most of the shadow detail, because linear 8-bit has fifteen
steps larger than a just-noticeable difference and all of them are in the darks.

So an intermediate buffer must be wider. The options, in ascending order of cost:

- *16-bit integer*, treated as linear. Ample for compositing, and the format most
  image editors use for their working space.
- *16-bit float* (half). The GPU standard. Buys enormous range in exchange for
  10 bits of mantissa, which is more than enough for display-referred
  work and is the reason it is the default in every modern renderer.
- *32-bit float*. Necessary for scene-referred rendering, where values are not
  bounded by 1.0 at all, and a light source may be thousands.

#keyidea[
  Decoding to linear is only half a decision. The other half is widening the
  buffer, and a linear workflow in eight bits is worse than no linear workflow at
  all.
]

=== What to store on disk

Storage is a separate question from computation, and the answer is usually the
opposite one. An image sitting in a file should generally be *encoded*, because
encoding is what makes eight bits sufficient; a PNG of linear light would need
sixteen bits to look as good and would be twice the size.

So: encoded on disk, linear in memory, encoded again on the way out. The file
format's job is to say which encoding, and the whole apparatus of ICC profiles
exists because for thirty years it mostly did not.

#marginnote[
  ICC profiles are Chapter 10's subject. The short version: a profile is a claim
  about a device, and an image without one is a set of numbers with no stated
  meaning, which software then guesses at, usually correctly and occasionally
  not.
]

== High dynamic range

Every curve so far has been relative. sRGB's 1.0 means "display white",
whatever that happens to be; the standard nominates a reference display at
80 candelas per square metre in a dim room, and essentially no real
monitor is set that way. @iec-61966-2-1 The signal says *how bright relative to
white*, and the display decides what white means.

High dynamic range breaks that arrangement, because a system that can show a
specular highlight at #qty(4000, [cd\/m#super[2]]) and a night sky in the same frame needs
the signal to say which. "Relative to white" is not a useful statement when the
picture contains things far brighter than anything that could reasonably be called
white.

=== PQ

SMPTE ST 2084 answers this with an *absolute* encoding. A PQ code value names a
luminance in candelas per square metre, from 0.0001 to
10000, and it means the same luminance on every display that claims to
implement it. @smpte-st2084

What makes PQ interesting is not the range but the derivation. Every transfer
function in this chapter so far came from hardware: the CRT's power law, and a toe
added to tame its singularity. PQ came from a model of the eye. Its shape is
derived from Barten's model of human contrast sensitivity, with the quantisation
steps placed so that each one falls just below the threshold of visibility across
the whole range.

#keyidea[
  PQ is the first transfer function in this book whose shape is an argument about
  perception rather than an accident of hardware. It is what you get when you
  design a perceptual code deliberately, instead of inheriting one.
]

The consequences are visible in how it spends its code values:

#listing(caption: [PQ code values at representative luminances, computed from the
  ST 2084 definition. Ten-bit codes shown for comparability with broadcast
  practice.])[
```
   cd/m2      PQ code    10-bit
   0.005       0.0151        15
       1       0.1499       153
     100       0.5081       520
     203       0.5807       594   <- HDR white
    1000       0.7518       769
   10000       1.0000      1023
```
]

Half the code range, 50.8 per cent of it, is spent below
#qty(100, [cd\/m#super[2]]), which is roughly the brightness of a conventional display's
white. The entire SDR world occupies the bottom half of PQ, and the top half is
the part that is new. That allocation is not a compromise; it is the model saying
that is where the eye's discrimination lives.

#sidenote[
  #qty(203, [cd\/m#super[2]]) is the reference level for HDR diffuse white: the
  brightness a sheet of white paper in the scene should be. It is a *reference*,
  not a limit, which is the distinction that makes HDR grading possible and HDR
  user interfaces difficult.
]

=== HLG

Hybrid log-gamma takes the opposite approach, and the difference is instructive.

Its curve is a square root below $1\/12$ joined to a logarithm above,
the two halves meeting at encoded value 0.5, which is a tidier
construction than it sounds:

$ V = cases(
  sqrt(3 L) & "if " L <= 1\/12,
  a ln(12 L - b) + c & "otherwise"
) $

But the important property is not the shape. HLG is *relative*, like sRGB: its
1.0 means "the brightest thing this display can do", and the display
applies its own system gamma based on how bright it is. The same signal
looks right on a #qty(1000, [cd\/m#super[2]]) television and on a #qty(400, [cd\/m#super[2]])
one, and it degrades gracefully on a display that is not HDR at all, which is
why broadcasters chose it and streaming services largely did not.

#aside(title: "Two answers to one question")[
  PQ and HLG are not two encodings of the same thing, and no curve swap converts
  between them. @itu-bt2100 PQ says *this pixel is 400 candelas*; HLG says *this
  pixel is 40% of whatever you have got*. Converting requires knowing the
  display's capability, which is information the signal deliberately does not
  carry in one case and deliberately does in the other.

  Which is correct depends on whether you are mastering for a known reference
  display or broadcasting to an unknown population of them. Both answers are
  right, for different questions, which is an unusually civilised outcome for a
  standards fight.
]

=== What HDR forces you to decide

The deepest consequence of an absolute encoding is that it makes a previously
avoidable question unavoidable: *how bright is white?*

In SDR the question never had to be answered. White was 1.0, the display
made 1.0 as bright as it made it, and the whole chain floated. In HDR,
1.0 is #qty(10000, [cd\/m#super[2]]), nothing can produce it, and every piece of
content has to state where it intends diffuse white to sit, because a user
interface drawn at 10000 would be painful, and a document page rendered
at 100 next to a 4000 highlight looks grey.

Every operating system that has shipped HDR has had to invent an answer, and they
have not invented the same one. That is Chapter 16's problem.

#aside(title: "Why this is harder than it sounds")[
  Diffuse white is not a property of the display or of the signal. It is a
  property of the *intent*: the brightness at which the author expected a sheet
  of paper in the scene to sit. A photograph, a film and a spreadsheet all want
  different answers, and they may be on screen at once.

  Which is why HDR user interfaces so often look wrong. The window manager has to
  choose a diffuse white for content that never stated one, in a composite where
  neighbouring windows assumed different values, on a display whose capability it
  may not know.
]

#exercises[
  #exercise(kind: "code")[
    Find the encoded value at which decoding sRGB as a pure 2.2 power law
    is exactly correct. Explain why there are two such values rather than one, and
    why neither of them is where you would guess.
  ]
  #exercise(kind: "code")[
    Resize an image by half in encoded values and in linear light. Measure the mean
    luminance of each result against the original and account for the sign of the
    error. Then do it with an image that is mostly flat colour and explain why the
    difference nearly vanishes.
  ]
  #exercise(kind: "proof")[
    Show that the two pieces of the sRGB transfer function meet with matching value
    *and* matching first derivative at $L = 0.0031308$, and find the values of the
    constants 1.055 and 0.055 that this requirement forces.
  ]
  #exercise(kind: "think", hint: [Consider what the display does with a signal it
    cannot reproduce, and what the content's author assumed about diffuse white.])[
    PQ encodes absolute luminance. Work out what happens when content mastered for a
    #qty(1000, [cd\/m#super[2]]) display is shown on a #qty(400, [cd\/m#super[2]]) one with no tone
    mapping, and decide whether the failure is better or worse than the equivalent
    failure in HLG.
  ]
  #exercise(kind: "think")[
    The precision table in this chapter says eight bits of linear light has fifteen
    steps larger than a just-noticeable difference. Sixteen-bit linear has none.
    Given that, argue for or against storing images on disk as 16-bit linear rather
    than 8-bit encoded, and identify the consideration that decides it.
  ]
]

#chapter-end()
