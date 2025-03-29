#version 300 es
//#extension GL_OES_EGL_image_external : require
#extension GL_ARB_shading_language_include : enable
#extension GL_ARB_explicit_uniform_location : require

#include "locations.h"

precision highp float;
in vec2 v_texcoord;
uniform sampler2D tex;
//uniform samplerExternalOES texture0;

layout(location = SU_LOC_TEXTYPE) uniform int texType; // eTextureType: 0 - rgba, 1 - rgbx, 2 - ext
// uniform int skipCM;
layout(location = SU_LOC_SOURCETF) uniform int sourceTF; // eTransferFunction
layout(location = SU_LOC_TARGETTF) uniform int targetTF; // eTransferFunction
layout(location = SU_LOC_SOURCEPRIMARIES) uniform mat4x2 sourcePrimaries;
layout(location = SU_LOC_TARGETPRIMARIES) uniform mat4x2 targetPrimaries;

layout(location = SU_LOC_ALPHA) uniform float alpha;

layout(location = SU_LOC_DISCARDOPAQUE) uniform int discardOpaque;
layout(location = SU_LOC_DISCARDALPHA) uniform int discardAlpha;
layout(location = SU_LOC_DISCARDALPHAVALUE) uniform float discardAlphaValue;

layout(location = SU_LOC_APPLYTINT) uniform int applyTint;
layout(location = SU_LOC_TINT) uniform vec3 tint;

#include "rounding.glsl"
#include "CM.glsl"

layout(location = 0) out vec4 fragColor;
void main() {
    vec4 pixColor;
    if (texType == 1)
        pixColor = vec4(texture(tex, v_texcoord).rgb, 1.0);
//    else if (texType == 2)
//        pixColor = texture(texture0, v_texcoord);
    else // assume rgba
        pixColor = texture(tex, v_texcoord);

    if (discardOpaque == 1 && pixColor[3] * alpha == 1.0)
        discard;

    if (discardAlpha == 1 && pixColor[3] <= discardAlphaValue)
        discard;

    // this shader shouldn't be used when skipCM == 1
    pixColor = doColorManagement(pixColor, sourceTF, sourcePrimaries, targetTF, targetPrimaries);

    if (applyTint == 1)
        pixColor = vec4(pixColor.rgb * tint.rgb, pixColor[3]);

    if (radius > 0.0)
        pixColor = rounding(pixColor);
    
    fragColor = pixColor * alpha;
}
