function getRotationPrecomputeL(precompute_L, rotationMatrix){
	let r = mat4.create();
	mat4.transpose(r, rotationMatrix)
	
	let SHRotateMatrix_3x3 = computeSquareMatrix_3by3(r);
	let SHRotateMatrix_5x5 = computeSquareMatrix_5by5(r);
	let result = [];
	for(let j = 0; j < 9; j++){
		result[j] = [];
	}
	for(let j = 0; j < 3; j++){
		let temp3 = [precompute_L[1][j], precompute_L[2][j], precompute_L[3][j]];
		let temp5 = [precompute_L[4][j], precompute_L[5][j], precompute_L[6][j], precompute_L[7][j], precompute_L[8][j]];
		temp3 = math.multiply(temp3, SHRotateMatrix_3x3);
		temp5 = math.multiply(temp5, SHRotateMatrix_5x5);
	
		result[0][j] = precompute_L[0][j];
		result[1][j] = temp3._data[0];
		result[2][j] = temp3._data[1];
		result[3][j] = temp3._data[2];
		result[4][j] = temp5._data[0];
		result[5][j] = temp5._data[1];
		result[6][j] = temp5._data[2];
		result[7][j] = temp5._data[3];
		result[8][j] = temp5._data[4];
	}

	return result;
}

function computeSquareMatrix_3by3(rotationMatrix){ // 计算方阵SA(-1) 3*3 
	
	// 1、pick ni - {ni}
	let n1 = [1, 0, 0, 0]; let n2 = [0, 0, 1, 0]; let n3 = [0, 1, 0, 0];

	// 2、{P(ni)} - A  A_inverse
	let sh1 = SHEval(n1[0], n1[1], n1[2], 3)
	let sh2 = SHEval(n2[0], n2[1], n2[2], 3)
	let sh3 = SHEval(n3[0], n3[1], n3[2], 3)

	let A = math.matrix(
	[
		[sh1[1], sh2[1], sh3[1]], 
		[sh1[2], sh2[2], sh3[2]], 
		[sh1[3], sh2[3], sh3[3]], 
	]);

	let A_inverse = math.inv(A);

	// 3、用 R 旋转 ni - {R(ni)}
	let n1M = vec4.create();
	let n2M = vec4.create();
	let n3M = vec4.create();
	mat4.multiply(n1M, rotationMatrix, n1);
	mat4.multiply(n2M, rotationMatrix, n2);
	mat4.multiply(n3M, rotationMatrix, n3);

	// 4、R(ni) SH投影 - S
	let _sh1 = SHEval(n1M[0], n1M[1], n1M[2], 3)
	let _sh2 = SHEval(n2M[0], n2M[1], n2M[2], 3)
	let _sh3 = SHEval(n3M[0], n3M[1], n3M[2], 3)

	let S = math.matrix(
	[
		[_sh1[1], _sh2[1], _sh3[1]], 
		[_sh1[2], _sh2[2], _sh3[2]], 
		[_sh1[3], _sh2[3], _sh3[3]], 

	]);

	// 5、S*A_inverse
	return math.multiply(S, A_inverse)   
}

function computeSquareMatrix_5by5(rotationMatrix){ // 计算方阵SA(-1) 5*5
	
	// 1、pick ni - {ni}
	let k = 1 / math.sqrt(2);
	let n1 = [1, 0, 0, 0]; let n2 = [0, 0, 1, 0]; let n3 = [k, k, 0, 0]; 
	let n4 = [k, 0, k, 0]; let n5 = [0, k, k, 0];

	// 2、{P(ni)} - A  A_inverse
	let sh1 = SHEval(n1[0], n1[1], n1[2], 3)
	let sh2 = SHEval(n2[0], n2[1], n2[2], 3)
	let sh3 = SHEval(n3[0], n3[1], n3[2], 3)
	let sh4 = SHEval(n4[0], n4[1], n4[2], 3)
	let sh5 = SHEval(n5[0], n5[1], n5[2], 3)

	let A = math.matrix(
	[
		[sh1[4], sh2[4], sh3[4], sh4[4], sh5[4]], 
		[sh1[5], sh2[5], sh3[5], sh4[5], sh5[5]], 
		[sh1[6], sh2[6], sh3[6], sh4[6], sh5[6]], 
		[sh1[7], sh2[7], sh3[7], sh4[7], sh5[7]], 
		[sh1[8], sh2[8], sh3[8], sh4[8], sh5[8]], 
	]);
	
	let A_inverse = math.inv(A);

	// 3、用 R 旋转 ni - {R(ni)}
	let n1M = vec4.create();
	let n2M = vec4.create();
	let n3M = vec4.create();
	let n4M = vec4.create();
	let n5M = vec4.create();
	mat4.multiply(n1M, rotationMatrix, n1);
	mat4.multiply(n2M, rotationMatrix, n2);
	mat4.multiply(n3M, rotationMatrix, n3);
	mat4.multiply(n4M, rotationMatrix, n4);
	mat4.multiply(n5M, rotationMatrix, n5);

	// 4、R(ni) SH投影 - S
	let _sh1 = SHEval(n1M[0], n1M[1], n1M[2], 3)
	let _sh2 = SHEval(n2M[0], n2M[1], n2M[2], 3)
	let _sh3 = SHEval(n3M[0], n3M[1], n3M[2], 3)
	let _sh4 = SHEval(n4M[0], n4M[1], n4M[2], 3)
	let _sh5 = SHEval(n5M[0], n5M[1], n5M[2], 3)

	let S = math.matrix(
	[	
		[_sh1[4], _sh2[4], _sh3[4], _sh4[4], _sh5[4]], 
		[_sh1[5], _sh2[5], _sh3[5], _sh4[5], _sh5[5]], 
		[_sh1[6], _sh2[6], _sh3[6], _sh4[6], _sh5[6]], 
		[_sh1[7], _sh2[7], _sh3[7], _sh4[7], _sh5[7]], 
		[_sh1[8], _sh2[8], _sh3[8], _sh4[8], _sh5[8]], 
	]);

	// 5、S*A_inverse
	return math.multiply(S, A_inverse)  
}

function mat4Matrix2mathMatrix(rotationMatrix){

	let mathMatrix = [];
	for(let i = 0; i < 4; i++){
		let r = [];
		for(let j = 0; j < 4; j++){
			r.push(rotationMatrix[i*4+j]);
		}
		mathMatrix.push(r);
	}
	return math.matrix(mathMatrix)

}

function getMat3ValueFromRGB(precomputeL){

    let colorMat3 = [];
    for(var i = 0; i<3; i++){
        colorMat3[i] = mat3.fromValues( precomputeL[0][i], precomputeL[1][i], precomputeL[2][i],
										precomputeL[3][i], precomputeL[4][i], precomputeL[5][i],
										precomputeL[6][i], precomputeL[7][i], precomputeL[8][i] ); 
	}
    return colorMat3;
}