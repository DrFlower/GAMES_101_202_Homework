
// order n
function SHEval(fX, fY, fZ, order)
{
   return SHEvalFct[order - 3](fX, fY, fZ);
}

SHEvalFct = [
   SHEval3,
   SHEval4,
   SHEval5,
   SHEval6,
   SHEval7,
   SHEval8,
   SHEval9,
   SHEval10
];

// order 3
function SHEval3(fX, fY, fZ) {
   var fC0,fC1,fS0,fS1,fTmpA,fTmpB,fTmpC;
   var fZ2 = fZ*fZ;
   var pSH = new Array(9);

   pSH[0] = 0.2820947917738781;
   pSH[2] = 0.4886025119029199*fZ;
   pSH[6] = 0.9461746957575601*fZ2 + -0.3153915652525201;
   fC0 = fX;
   fS0 = fY;

   fTmpA = -0.48860251190292;
   pSH[3] = fTmpA*fC0;
   pSH[1] = fTmpA*fS0;
   fTmpB = -1.092548430592079*fZ;
   pSH[7] = fTmpB*fC0;
   pSH[5] = fTmpB*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpC = 0.5462742152960395;
   pSH[8] = fTmpC*fC1;
   pSH[4] = fTmpC*fS1;

   return pSH;
}

// order 4
function SHEval4(fX, fY, fZ)
{
   var fC0,fC1,fS0,fS1,fTmpA,fTmpB,fTmpC;
   var fZ2 = fZ*fZ;
   var pSH = new Array(16);

   pSH[0] = 0.2820947917738781;
   pSH[2] = 0.4886025119029199*fZ;
   pSH[6] = 0.9461746957575601*fZ2 + -0.3153915652525201;
   pSH[12] = fZ*(1.865881662950577*fZ2 + -1.119528997770346);
   fC0 = fX;
   fS0 = fY;

   fTmpA = -0.48860251190292;
   pSH[3] = fTmpA*fC0;
   pSH[1] = fTmpA*fS0;
   fTmpB = -1.092548430592079*fZ;
   pSH[7] = fTmpB*fC0;
   pSH[5] = fTmpB*fS0;
   fTmpC = -2.285228997322329*fZ2 + 0.4570457994644658;
   pSH[13] = fTmpC*fC0;
   pSH[11] = fTmpC*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.5462742152960395;
   pSH[8] = fTmpA*fC1;
   pSH[4] = fTmpA*fS1;
   fTmpB = 1.445305721320277*fZ;
   pSH[14] = fTmpB*fC1;
   pSH[10] = fTmpB*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpC = -0.5900435899266435;
   pSH[15] = fTmpC*fC0;
   pSH[9] = fTmpC*fS0;

   return pSH;
}

// order 5
function SHEval5(fX, fY, fZ)
{
   var fC0,fC1,fS0,fS1,fTmpA,fTmpB,fTmpC;
   var fZ2 = fZ*fZ;
   var pSH = new Array(25);

   pSH[0] = 0.2820947917738781;
   pSH[2] = 0.4886025119029199*fZ;
   pSH[6] = 0.9461746957575601*fZ2 + -0.3153915652525201;
   pSH[12] = fZ*(1.865881662950577*fZ2 + -1.119528997770346);
   pSH[20] = 1.984313483298443*fZ*pSH[12] + -1.006230589874905*pSH[6];
   fC0 = fX;
   fS0 = fY;

   fTmpA = -0.48860251190292;
   pSH[3] = fTmpA*fC0;
   pSH[1] = fTmpA*fS0;
   fTmpB = -1.092548430592079*fZ;
   pSH[7] = fTmpB*fC0;
   pSH[5] = fTmpB*fS0;
   fTmpC = -2.285228997322329*fZ2 + 0.4570457994644658;
   pSH[13] = fTmpC*fC0;
   pSH[11] = fTmpC*fS0;
   fTmpA = fZ*(-4.683325804901025*fZ2 + 2.007139630671868);
   pSH[21] = fTmpA*fC0;
   pSH[19] = fTmpA*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.5462742152960395;
   pSH[8] = fTmpA*fC1;
   pSH[4] = fTmpA*fS1;
   fTmpB = 1.445305721320277*fZ;
   pSH[14] = fTmpB*fC1;
   pSH[10] = fTmpB*fS1;
   fTmpC = 3.31161143515146*fZ2 + -0.47308734787878;
   pSH[22] = fTmpC*fC1;
   pSH[18] = fTmpC*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpA = -0.5900435899266435;
   pSH[15] = fTmpA*fC0;
   pSH[9] = fTmpA*fS0;
   fTmpB = -1.770130769779931*fZ;
   pSH[23] = fTmpB*fC0;
   pSH[17] = fTmpB*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpC = 0.6258357354491763;
   pSH[24] = fTmpC*fC1;
   pSH[16] = fTmpC*fS1;

   return pSH;
}

// order 6
function SHEval6(fX, fY, fZ)
{
   var fC0,fC1,fS0,fS1,fTmpA,fTmpB,fTmpC;
   var fZ2 = fZ*fZ;
   var pSH = new Array(36);

   pSH[0] = 0.2820947917738781;
   pSH[2] = 0.4886025119029199*fZ;
   pSH[6] = 0.9461746957575601*fZ2 + -0.3153915652525201;
   pSH[12] = fZ*(1.865881662950577*fZ2 + -1.119528997770346);
   pSH[20] = 1.984313483298443*fZ*pSH[12] + -1.006230589874905*pSH[6];
   pSH[30] = 1.98997487421324*fZ*pSH[20] + -1.002853072844814*pSH[12];
   fC0 = fX;
   fS0 = fY;

   fTmpA = -0.48860251190292;
   pSH[3] = fTmpA*fC0;
   pSH[1] = fTmpA*fS0;
   fTmpB = -1.092548430592079*fZ;
   pSH[7] = fTmpB*fC0;
   pSH[5] = fTmpB*fS0;
   fTmpC = -2.285228997322329*fZ2 + 0.4570457994644658;
   pSH[13] = fTmpC*fC0;
   pSH[11] = fTmpC*fS0;
   fTmpA = fZ*(-4.683325804901025*fZ2 + 2.007139630671868);
   pSH[21] = fTmpA*fC0;
   pSH[19] = fTmpA*fS0;
   fTmpB = 2.03100960115899*fZ*fTmpA + -0.991031208965115*fTmpC;
   pSH[31] = fTmpB*fC0;
   pSH[29] = fTmpB*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.5462742152960395;
   pSH[8] = fTmpA*fC1;
   pSH[4] = fTmpA*fS1;
   fTmpB = 1.445305721320277*fZ;
   pSH[14] = fTmpB*fC1;
   pSH[10] = fTmpB*fS1;
   fTmpC = 3.31161143515146*fZ2 + -0.47308734787878;
   pSH[22] = fTmpC*fC1;
   pSH[18] = fTmpC*fS1;
   fTmpA = fZ*(7.190305177459987*fZ2 + -2.396768392486662);
   pSH[32] = fTmpA*fC1;
   pSH[28] = fTmpA*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpA = -0.5900435899266435;
   pSH[15] = fTmpA*fC0;
   pSH[9] = fTmpA*fS0;
   fTmpB = -1.770130769779931*fZ;
   pSH[23] = fTmpB*fC0;
   pSH[17] = fTmpB*fS0;
   fTmpC = -4.403144694917254*fZ2 + 0.4892382994352505;
   pSH[33] = fTmpC*fC0;
   pSH[27] = fTmpC*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.6258357354491763;
   pSH[24] = fTmpA*fC1;
   pSH[16] = fTmpA*fS1;
   fTmpB = 2.075662314881041*fZ;
   pSH[34] = fTmpB*fC1;
   pSH[26] = fTmpB*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpC = -0.6563820568401703;
   pSH[35] = fTmpC*fC0;
   pSH[25] = fTmpC*fS0;

   return pSH;
}

// order 7
function SHEval7(fX, fY, fZ)
{
   var fC0,fC1,fS0,fS1,fTmpA,fTmpB,fTmpC;
   var fZ2 = fZ*fZ;
   var pSH = new Array(49);

   pSH[0] = 0.2820947917738781;
   pSH[2] = 0.4886025119029199*fZ;
   pSH[6] = 0.9461746957575601*fZ2 + -0.3153915652525201;
   pSH[12] = fZ*(1.865881662950577*fZ2 + -1.119528997770346);
   pSH[20] = 1.984313483298443*fZ*pSH[12] + -1.006230589874905*pSH[6];
   pSH[30] = 1.98997487421324*fZ*pSH[20] + -1.002853072844814*pSH[12];
   pSH[42] = 1.993043457183567*fZ*pSH[30] + -1.001542020962219*pSH[20];
   fC0 = fX;
   fS0 = fY;

   fTmpA = -0.48860251190292;
   pSH[3] = fTmpA*fC0;
   pSH[1] = fTmpA*fS0;
   fTmpB = -1.092548430592079*fZ;
   pSH[7] = fTmpB*fC0;
   pSH[5] = fTmpB*fS0;
   fTmpC = -2.285228997322329*fZ2 + 0.4570457994644658;
   pSH[13] = fTmpC*fC0;
   pSH[11] = fTmpC*fS0;
   fTmpA = fZ*(-4.683325804901025*fZ2 + 2.007139630671868);
   pSH[21] = fTmpA*fC0;
   pSH[19] = fTmpA*fS0;
   fTmpB = 2.03100960115899*fZ*fTmpA + -0.991031208965115*fTmpC;
   pSH[31] = fTmpB*fC0;
   pSH[29] = fTmpB*fS0;
   fTmpC = 2.021314989237028*fZ*fTmpB + -0.9952267030562385*fTmpA;
   pSH[43] = fTmpC*fC0;
   pSH[41] = fTmpC*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.5462742152960395;
   pSH[8] = fTmpA*fC1;
   pSH[4] = fTmpA*fS1;
   fTmpB = 1.445305721320277*fZ;
   pSH[14] = fTmpB*fC1;
   pSH[10] = fTmpB*fS1;
   fTmpC = 3.31161143515146*fZ2 + -0.47308734787878;
   pSH[22] = fTmpC*fC1;
   pSH[18] = fTmpC*fS1;
   fTmpA = fZ*(7.190305177459987*fZ2 + -2.396768392486662);
   pSH[32] = fTmpA*fC1;
   pSH[28] = fTmpA*fS1;
   fTmpB = 2.11394181566097*fZ*fTmpA + -0.9736101204623268*fTmpC;
   pSH[44] = fTmpB*fC1;
   pSH[40] = fTmpB*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpA = -0.5900435899266435;
   pSH[15] = fTmpA*fC0;
   pSH[9] = fTmpA*fS0;
   fTmpB = -1.770130769779931*fZ;
   pSH[23] = fTmpB*fC0;
   pSH[17] = fTmpB*fS0;
   fTmpC = -4.403144694917254*fZ2 + 0.4892382994352505;
   pSH[33] = fTmpC*fC0;
   pSH[27] = fTmpC*fS0;
   fTmpA = fZ*(-10.13325785466416*fZ2 + 2.763615778544771);
   pSH[45] = fTmpA*fC0;
   pSH[39] = fTmpA*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.6258357354491763;
   pSH[24] = fTmpA*fC1;
   pSH[16] = fTmpA*fS1;
   fTmpB = 2.075662314881041*fZ;
   pSH[34] = fTmpB*fC1;
   pSH[26] = fTmpB*fS1;
   fTmpC = 5.550213908015966*fZ2 + -0.5045649007287241;
   pSH[46] = fTmpC*fC1;
   pSH[38] = fTmpC*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpA = -0.6563820568401703;
   pSH[35] = fTmpA*fC0;
   pSH[25] = fTmpA*fS0;
   fTmpB = -2.366619162231753*fZ;
   pSH[47] = fTmpB*fC0;
   pSH[37] = fTmpB*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpC = 0.6831841051919144;
   pSH[48] = fTmpC*fC1;
   pSH[36] = fTmpC*fS1;

   return pSH;
}

// order 8
function SHEval8(fX, fY, fZ)
{
   var fC0,fC1,fS0,fS1,fTmpA,fTmpB,fTmpC;
   var fZ2 = fZ*fZ;
   var pSH = new Array(64);

   pSH[0] = 0.2820947917738781;
   pSH[2] = 0.4886025119029199*fZ;
   pSH[6] = 0.9461746957575601*fZ2 + -0.3153915652525201;
   pSH[12] = fZ*(1.865881662950577*fZ2 + -1.119528997770346);
   pSH[20] = 1.984313483298443*fZ*pSH[12] + -1.006230589874905*pSH[6];
   pSH[30] = 1.98997487421324*fZ*pSH[20] + -1.002853072844814*pSH[12];
   pSH[42] = 1.993043457183567*fZ*pSH[30] + -1.001542020962219*pSH[20];
   pSH[56] = 1.994891434824135*fZ*pSH[42] + -1.000927213921958*pSH[30];
   fC0 = fX;
   fS0 = fY;

   fTmpA = -0.48860251190292;
   pSH[3] = fTmpA*fC0;
   pSH[1] = fTmpA*fS0;
   fTmpB = -1.092548430592079*fZ;
   pSH[7] = fTmpB*fC0;
   pSH[5] = fTmpB*fS0;
   fTmpC = -2.285228997322329*fZ2 + 0.4570457994644658;
   pSH[13] = fTmpC*fC0;
   pSH[11] = fTmpC*fS0;
   fTmpA = fZ*(-4.683325804901025*fZ2 + 2.007139630671868);
   pSH[21] = fTmpA*fC0;
   pSH[19] = fTmpA*fS0;
   fTmpB = 2.03100960115899*fZ*fTmpA + -0.991031208965115*fTmpC;
   pSH[31] = fTmpB*fC0;
   pSH[29] = fTmpB*fS0;
   fTmpC = 2.021314989237028*fZ*fTmpB + -0.9952267030562385*fTmpA;
   pSH[43] = fTmpC*fC0;
   pSH[41] = fTmpC*fS0;
   fTmpA = 2.015564437074638*fZ*fTmpC + -0.9971550440218319*fTmpB;
   pSH[57] = fTmpA*fC0;
   pSH[55] = fTmpA*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.5462742152960395;
   pSH[8] = fTmpA*fC1;
   pSH[4] = fTmpA*fS1;
   fTmpB = 1.445305721320277*fZ;
   pSH[14] = fTmpB*fC1;
   pSH[10] = fTmpB*fS1;
   fTmpC = 3.31161143515146*fZ2 + -0.47308734787878;
   pSH[22] = fTmpC*fC1;
   pSH[18] = fTmpC*fS1;
   fTmpA = fZ*(7.190305177459987*fZ2 + -2.396768392486662);
   pSH[32] = fTmpA*fC1;
   pSH[28] = fTmpA*fS1;
   fTmpB = 2.11394181566097*fZ*fTmpA + -0.9736101204623268*fTmpC;
   pSH[44] = fTmpB*fC1;
   pSH[40] = fTmpB*fS1;
   fTmpC = 2.081665999466133*fZ*fTmpB + -0.9847319278346618*fTmpA;
   pSH[58] = fTmpC*fC1;
   pSH[54] = fTmpC*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpA = -0.5900435899266435;
   pSH[15] = fTmpA*fC0;
   pSH[9] = fTmpA*fS0;
   fTmpB = -1.770130769779931*fZ;
   pSH[23] = fTmpB*fC0;
   pSH[17] = fTmpB*fS0;
   fTmpC = -4.403144694917254*fZ2 + 0.4892382994352505;
   pSH[33] = fTmpC*fC0;
   pSH[27] = fTmpC*fS0;
   fTmpA = fZ*(-10.13325785466416*fZ2 + 2.763615778544771);
   pSH[45] = fTmpA*fC0;
   pSH[39] = fTmpA*fS0;
   fTmpB = 2.207940216581962*fZ*fTmpA + -0.959403223600247*fTmpC;
   pSH[59] = fTmpB*fC0;
   pSH[53] = fTmpB*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.6258357354491763;
   pSH[24] = fTmpA*fC1;
   pSH[16] = fTmpA*fS1;
   fTmpB = 2.075662314881041*fZ;
   pSH[34] = fTmpB*fC1;
   pSH[26] = fTmpB*fS1;
   fTmpC = 5.550213908015966*fZ2 + -0.5045649007287241;
   pSH[46] = fTmpC*fC1;
   pSH[38] = fTmpC*fS1;
   fTmpA = fZ*(13.49180504672677*fZ2 + -3.113493472321562);
   pSH[60] = fTmpA*fC1;
   pSH[52] = fTmpA*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpA = -0.6563820568401703;
   pSH[35] = fTmpA*fC0;
   pSH[25] = fTmpA*fS0;
   fTmpB = -2.366619162231753*fZ;
   pSH[47] = fTmpB*fC0;
   pSH[37] = fTmpB*fS0;
   fTmpC = -6.745902523363385*fZ2 + 0.5189155787202604;
   pSH[61] = fTmpC*fC0;
   pSH[51] = fTmpC*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.6831841051919144;
   pSH[48] = fTmpA*fC1;
   pSH[36] = fTmpA*fS1;
   fTmpB = 2.645960661801901*fZ;
   pSH[62] = fTmpB*fC1;
   pSH[50] = fTmpB*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpC = -0.7071627325245963;
   pSH[63] = fTmpC*fC0;
   pSH[49] = fTmpC*fS0;

   return pSH;
}

// order 9
function SHEval9(fX, fY, fZ)
{
   var fC0,fC1,fS0,fS1,fTmpA,fTmpB,fTmpC;
   var fZ2 = fZ*fZ;
   var pSH = new Array(81);

   pSH[0] = 0.2820947917738781;
   pSH[2] = 0.4886025119029199*fZ;
   pSH[6] = 0.9461746957575601*fZ2 + -0.3153915652525201;
   pSH[12] = fZ*(1.865881662950577*fZ2 + -1.119528997770346);
   pSH[20] = 1.984313483298443*fZ*pSH[12] + -1.006230589874905*pSH[6];
   pSH[30] = 1.98997487421324*fZ*pSH[20] + -1.002853072844814*pSH[12];
   pSH[42] = 1.993043457183567*fZ*pSH[30] + -1.001542020962219*pSH[20];
   pSH[56] = 1.994891434824135*fZ*pSH[42] + -1.000927213921958*pSH[30];
   pSH[72] = 1.996089927833914*fZ*pSH[56] + -1.000600781069515*pSH[42];
   fC0 = fX;
   fS0 = fY;

   fTmpA = -0.48860251190292;
   pSH[3] = fTmpA*fC0;
   pSH[1] = fTmpA*fS0;
   fTmpB = -1.092548430592079*fZ;
   pSH[7] = fTmpB*fC0;
   pSH[5] = fTmpB*fS0;
   fTmpC = -2.285228997322329*fZ2 + 0.4570457994644658;
   pSH[13] = fTmpC*fC0;
   pSH[11] = fTmpC*fS0;
   fTmpA = fZ*(-4.683325804901025*fZ2 + 2.007139630671868);
   pSH[21] = fTmpA*fC0;
   pSH[19] = fTmpA*fS0;
   fTmpB = 2.03100960115899*fZ*fTmpA + -0.991031208965115*fTmpC;
   pSH[31] = fTmpB*fC0;
   pSH[29] = fTmpB*fS0;
   fTmpC = 2.021314989237028*fZ*fTmpB + -0.9952267030562385*fTmpA;
   pSH[43] = fTmpC*fC0;
   pSH[41] = fTmpC*fS0;
   fTmpA = 2.015564437074638*fZ*fTmpC + -0.9971550440218319*fTmpB;
   pSH[57] = fTmpA*fC0;
   pSH[55] = fTmpA*fS0;
   fTmpB = 2.011869540407391*fZ*fTmpA + -0.9981668178901745*fTmpC;
   pSH[73] = fTmpB*fC0;
   pSH[71] = fTmpB*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.5462742152960395;
   pSH[8] = fTmpA*fC1;
   pSH[4] = fTmpA*fS1;
   fTmpB = 1.445305721320277*fZ;
   pSH[14] = fTmpB*fC1;
   pSH[10] = fTmpB*fS1;
   fTmpC = 3.31161143515146*fZ2 + -0.47308734787878;
   pSH[22] = fTmpC*fC1;
   pSH[18] = fTmpC*fS1;
   fTmpA = fZ*(7.190305177459987*fZ2 + -2.396768392486662);
   pSH[32] = fTmpA*fC1;
   pSH[28] = fTmpA*fS1;
   fTmpB = 2.11394181566097*fZ*fTmpA + -0.9736101204623268*fTmpC;
   pSH[44] = fTmpB*fC1;
   pSH[40] = fTmpB*fS1;
   fTmpC = 2.081665999466133*fZ*fTmpB + -0.9847319278346618*fTmpA;
   pSH[58] = fTmpC*fC1;
   pSH[54] = fTmpC*fS1;
   fTmpA = 2.06155281280883*fZ*fTmpC + -0.9903379376602873*fTmpB;
   pSH[74] = fTmpA*fC1;
   pSH[70] = fTmpA*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpA = -0.5900435899266435;
   pSH[15] = fTmpA*fC0;
   pSH[9] = fTmpA*fS0;
   fTmpB = -1.770130769779931*fZ;
   pSH[23] = fTmpB*fC0;
   pSH[17] = fTmpB*fS0;
   fTmpC = -4.403144694917254*fZ2 + 0.4892382994352505;
   pSH[33] = fTmpC*fC0;
   pSH[27] = fTmpC*fS0;
   fTmpA = fZ*(-10.13325785466416*fZ2 + 2.763615778544771);
   pSH[45] = fTmpA*fC0;
   pSH[39] = fTmpA*fS0;
   fTmpB = 2.207940216581962*fZ*fTmpA + -0.959403223600247*fTmpC;
   pSH[59] = fTmpB*fC0;
   pSH[53] = fTmpB*fS0;
   fTmpC = 2.15322168769582*fZ*fTmpB + -0.9752173865600178*fTmpA;
   pSH[75] = fTmpC*fC0;
   pSH[69] = fTmpC*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.6258357354491763;
   pSH[24] = fTmpA*fC1;
   pSH[16] = fTmpA*fS1;
   fTmpB = 2.075662314881041*fZ;
   pSH[34] = fTmpB*fC1;
   pSH[26] = fTmpB*fS1;
   fTmpC = 5.550213908015966*fZ2 + -0.5045649007287241;
   pSH[46] = fTmpC*fC1;
   pSH[38] = fTmpC*fS1;
   fTmpA = fZ*(13.49180504672677*fZ2 + -3.113493472321562);
   pSH[60] = fTmpA*fC1;
   pSH[52] = fTmpA*fS1;
   fTmpB = 2.304886114323221*fZ*fTmpA + -0.9481763873554654*fTmpC;
   pSH[76] = fTmpB*fC1;
   pSH[68] = fTmpB*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpA = -0.6563820568401703;
   pSH[35] = fTmpA*fC0;
   pSH[25] = fTmpA*fS0;
   fTmpB = -2.366619162231753*fZ;
   pSH[47] = fTmpB*fC0;
   pSH[37] = fTmpB*fS0;
   fTmpC = -6.745902523363385*fZ2 + 0.5189155787202604;
   pSH[61] = fTmpC*fC0;
   pSH[51] = fTmpC*fS0;
   fTmpA = fZ*(-17.24955311049054*fZ2 + 3.449910622098108);
   pSH[77] = fTmpA*fC0;
   pSH[67] = fTmpA*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.6831841051919144;
   pSH[48] = fTmpA*fC1;
   pSH[36] = fTmpA*fS1;
   fTmpB = 2.645960661801901*fZ;
   pSH[62] = fTmpB*fC1;
   pSH[50] = fTmpB*fS1;
   fTmpC = 7.984991490893139*fZ2 + -0.5323327660595426;
   pSH[78] = fTmpC*fC1;
   pSH[66] = fTmpC*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpA = -0.7071627325245963;
   pSH[63] = fTmpA*fC0;
   pSH[49] = fTmpA*fS0;
   fTmpB = -2.91570664069932*fZ;
   pSH[79] = fTmpB*fC0;
   pSH[65] = fTmpB*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpC = 0.72892666017483;
   pSH[80] = fTmpC*fC1;
   pSH[64] = fTmpC*fS1;

   return pSH;
}

// order 10
function SHEval10(fX, fY, fZ)
{
   var fC0,fC1,fS0,fS1,fTmpA,fTmpB,fTmpC;
   var fZ2 = fZ*fZ;
   var pSH = new Array(100);

   pSH[0] = 0.2820947917738781;
   pSH[2] = 0.4886025119029199*fZ;
   pSH[6] = 0.9461746957575601*fZ2 + -0.3153915652525201;
   pSH[12] = fZ*(1.865881662950577*fZ2 + -1.119528997770346);
   pSH[20] = 1.984313483298443*fZ*pSH[12] + -1.006230589874905*pSH[6];
   pSH[30] = 1.98997487421324*fZ*pSH[20] + -1.002853072844814*pSH[12];
   pSH[42] = 1.993043457183567*fZ*pSH[30] + -1.001542020962219*pSH[20];
   pSH[56] = 1.994891434824135*fZ*pSH[42] + -1.000927213921958*pSH[30];
   pSH[72] = 1.996089927833914*fZ*pSH[56] + -1.000600781069515*pSH[42];
   pSH[90] = 1.996911195067937*fZ*pSH[72] + -1.000411437993134*pSH[56];
   fC0 = fX;
   fS0 = fY;

   fTmpA = -0.48860251190292;
   pSH[3] = fTmpA*fC0;
   pSH[1] = fTmpA*fS0;
   fTmpB = -1.092548430592079*fZ;
   pSH[7] = fTmpB*fC0;
   pSH[5] = fTmpB*fS0;
   fTmpC = -2.285228997322329*fZ2 + 0.4570457994644658;
   pSH[13] = fTmpC*fC0;
   pSH[11] = fTmpC*fS0;
   fTmpA = fZ*(-4.683325804901025*fZ2 + 2.007139630671868);
   pSH[21] = fTmpA*fC0;
   pSH[19] = fTmpA*fS0;
   fTmpB = 2.03100960115899*fZ*fTmpA + -0.991031208965115*fTmpC;
   pSH[31] = fTmpB*fC0;
   pSH[29] = fTmpB*fS0;
   fTmpC = 2.021314989237028*fZ*fTmpB + -0.9952267030562385*fTmpA;
   pSH[43] = fTmpC*fC0;
   pSH[41] = fTmpC*fS0;
   fTmpA = 2.015564437074638*fZ*fTmpC + -0.9971550440218319*fTmpB;
   pSH[57] = fTmpA*fC0;
   pSH[55] = fTmpA*fS0;
   fTmpB = 2.011869540407391*fZ*fTmpA + -0.9981668178901745*fTmpC;
   pSH[73] = fTmpB*fC0;
   pSH[71] = fTmpB*fS0;
   fTmpC = 2.009353129741012*fZ*fTmpB + -0.9987492177719088*fTmpA;
   pSH[91] = fTmpC*fC0;
   pSH[89] = fTmpC*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.5462742152960395;
   pSH[8] = fTmpA*fC1;
   pSH[4] = fTmpA*fS1;
   fTmpB = 1.445305721320277*fZ;
   pSH[14] = fTmpB*fC1;
   pSH[10] = fTmpB*fS1;
   fTmpC = 3.31161143515146*fZ2 + -0.47308734787878;
   pSH[22] = fTmpC*fC1;
   pSH[18] = fTmpC*fS1;
   fTmpA = fZ*(7.190305177459987*fZ2 + -2.396768392486662);
   pSH[32] = fTmpA*fC1;
   pSH[28] = fTmpA*fS1;
   fTmpB = 2.11394181566097*fZ*fTmpA + -0.9736101204623268*fTmpC;
   pSH[44] = fTmpB*fC1;
   pSH[40] = fTmpB*fS1;
   fTmpC = 2.081665999466133*fZ*fTmpB + -0.9847319278346618*fTmpA;
   pSH[58] = fTmpC*fC1;
   pSH[54] = fTmpC*fS1;
   fTmpA = 2.06155281280883*fZ*fTmpC + -0.9903379376602873*fTmpB;
   pSH[74] = fTmpA*fC1;
   pSH[70] = fTmpA*fS1;
   fTmpB = 2.048122358357819*fZ*fTmpA + -0.9934852726704042*fTmpC;
   pSH[92] = fTmpB*fC1;
   pSH[88] = fTmpB*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpA = -0.5900435899266435;
   pSH[15] = fTmpA*fC0;
   pSH[9] = fTmpA*fS0;
   fTmpB = -1.770130769779931*fZ;
   pSH[23] = fTmpB*fC0;
   pSH[17] = fTmpB*fS0;
   fTmpC = -4.403144694917254*fZ2 + 0.4892382994352505;
   pSH[33] = fTmpC*fC0;
   pSH[27] = fTmpC*fS0;
   fTmpA = fZ*(-10.13325785466416*fZ2 + 2.763615778544771);
   pSH[45] = fTmpA*fC0;
   pSH[39] = fTmpA*fS0;
   fTmpB = 2.207940216581962*fZ*fTmpA + -0.959403223600247*fTmpC;
   pSH[59] = fTmpB*fC0;
   pSH[53] = fTmpB*fS0;
   fTmpC = 2.15322168769582*fZ*fTmpB + -0.9752173865600178*fTmpA;
   pSH[75] = fTmpC*fC0;
   pSH[69] = fTmpC*fS0;
   fTmpA = 2.118044171189805*fZ*fTmpC + -0.9836628449792094*fTmpB;
   pSH[93] = fTmpA*fC0;
   pSH[87] = fTmpA*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.6258357354491763;
   pSH[24] = fTmpA*fC1;
   pSH[16] = fTmpA*fS1;
   fTmpB = 2.075662314881041*fZ;
   pSH[34] = fTmpB*fC1;
   pSH[26] = fTmpB*fS1;
   fTmpC = 5.550213908015966*fZ2 + -0.5045649007287241;
   pSH[46] = fTmpC*fC1;
   pSH[38] = fTmpC*fS1;
   fTmpA = fZ*(13.49180504672677*fZ2 + -3.113493472321562);
   pSH[60] = fTmpA*fC1;
   pSH[52] = fTmpA*fS1;
   fTmpB = 2.304886114323221*fZ*fTmpA + -0.9481763873554654*fTmpC;
   pSH[76] = fTmpB*fC1;
   pSH[68] = fTmpB*fS1;
   fTmpC = 2.229177150706235*fZ*fTmpB + -0.9671528397231821*fTmpA;
   pSH[94] = fTmpC*fC1;
   pSH[86] = fTmpC*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpA = -0.6563820568401703;
   pSH[35] = fTmpA*fC0;
   pSH[25] = fTmpA*fS0;
   fTmpB = -2.366619162231753*fZ;
   pSH[47] = fTmpB*fC0;
   pSH[37] = fTmpB*fS0;
   fTmpC = -6.745902523363385*fZ2 + 0.5189155787202604;
   pSH[61] = fTmpC*fC0;
   pSH[51] = fTmpC*fS0;
   fTmpA = fZ*(-17.24955311049054*fZ2 + 3.449910622098108);
   pSH[77] = fTmpA*fC0;
   pSH[67] = fTmpA*fS0;
   fTmpB = 2.401636346922062*fZ*fTmpA + -0.9392246042043708*fTmpC;
   pSH[95] = fTmpB*fC0;
   pSH[85] = fTmpB*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.6831841051919144;
   pSH[48] = fTmpA*fC1;
   pSH[36] = fTmpA*fS1;
   fTmpB = 2.645960661801901*fZ;
   pSH[62] = fTmpB*fC1;
   pSH[50] = fTmpB*fS1;
   fTmpC = 7.984991490893139*fZ2 + -0.5323327660595426;
   pSH[78] = fTmpC*fC1;
   pSH[66] = fTmpC*fS1;
   fTmpA = fZ*(21.39289019090864*fZ2 + -3.775215916042701);
   pSH[96] = fTmpA*fC1;
   pSH[84] = fTmpA*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpA = -0.7071627325245963;
   pSH[63] = fTmpA*fC0;
   pSH[49] = fTmpA*fS0;
   fTmpB = -2.91570664069932*fZ;
   pSH[79] = fTmpB*fC0;
   pSH[65] = fTmpB*fS0;
   fTmpC = -9.263393182848905*fZ2 + 0.5449054813440533;
   pSH[97] = fTmpC*fC0;
   pSH[83] = fTmpC*fS0;
   fC1 = fX*fC0 - fY*fS0;
   fS1 = fX*fS0 + fY*fC0;

   fTmpA = 0.72892666017483;
   pSH[80] = fTmpA*fC1;
   pSH[64] = fTmpA*fS1;
   fTmpB = 3.177317648954698*fZ;
   pSH[98] = fTmpB*fC1;
   pSH[82] = fTmpB*fS1;
   fC0 = fX*fC1 - fY*fS1;
   fS0 = fX*fS1 + fY*fC1;

   fTmpC = -0.7489009518531884;
   pSH[99] = fTmpC*fC0;
   pSH[81] = fTmpC*fS0;

   return pSH;
}
