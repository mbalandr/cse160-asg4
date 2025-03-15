/*
Mariah Balandran
mbalandr@ucsc.edu

Notes to Grader:
Followed video tutorial playlist provided at the top of the assignment.
*/

class Cube {
    constructor() {
        this.type = 'cube';
        // this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        // this.size = 5.0;
        // this.segments = 10;
        // this.rotation = Math.random() * 360;
        this.matrix = new Matrix4();
        this.colorNum = -1;
        this.specON = false;
        this.normalMatrix = new Matrix4();
    }

    render() {
        // var xy = this.position;
        var rgba = this.color;
        // var size = this.size;
        gl.uniform1i(u_whichColor, this.colorNum);

        gl.uniform1i(u_specON, this.specON);

        // Pass the color of a point to u_FragColor variable (color)
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);

        // Front of cube
        drawTriangle3DNormal([0.0, 0.0, 0.0,   1.0, 1.0, 0.0,   1.0, 0.0, 0.0], [0.0, 0.0, -1.0,   0.0, 0.0, -1.0,   0.0, 0.0, -1.0]);
        drawTriangle3DNormal([0.0, 0.0, 0.0,   0.0, 1.0, 0.0,   1.0, 1.0, 0.0], [0.0, 0.0, -1.0,   0.0, 0.0, -1.0,   0.0, 0.0, -1.0]);

        // Pass the color of a point to u_FragColor variable (shading/lighting)
        // gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);

        // Top of cube
        drawTriangle3DNormal([0.0, 1.0, 0.0,   0.0, 1.0, 1.0,   1.0, 1.0, 1.0], [0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0]);
        drawTriangle3DNormal([0.0, 1.0, 0.0,   1.0, 1.0, 1.0,   1.0, 1.0, 0.0], [0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0]);

        // Pass the color of a point to u_FragColor variable (shading/lighting)
        // gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);

        // Right side of cube
        drawTriangle3DNormal([1.0, 0.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 1.0], [1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0]);
        drawTriangle3DNormal([1.0, 0.0, 0.0,   1.0, 0.0, 1.0,   1.0, 1.0, 1.0], [1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0]);

        // Pass the color of a point to u_FragColor variable (shading/lighting)
        // gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);

        // Left side of cube
        drawTriangle3DNormal([0.0, 0.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 1.0], [-1.0, 0.0, 0.0,   -1.0, 0.0, 0.0,   -1.0, 0.0, 0.0]);
        drawTriangle3DNormal([0.0, 0.0, 0.0,   0.0, 0.0, 1.0,   0.0, 1.0, 1.0], [-1.0, 0.0, 0.0,   -1.0, 0.0, 0.0,   -1.0, 0.0, 0.0]);

        // Pass the color of a point to u_FragColor variable (shading/lighting)
        // gl.uniform4f(u_FragColor, rgba[0]*0.6, rgba[1]*0.6, rgba[2]*0.6, rgba[3]);

        // Back side of cube
        drawTriangle3DNormal([0.0, 0.0, 1.0,   1.0, 1.0, 1.0,   1.0, 0.0, 1.0], [0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0]);
        drawTriangle3DNormal([0.0, 0.0, 1.0,   0.0, 1.0, 1.0,   1.0, 1.0, 1.0], [0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0]);

        // Pass the color of a point to u_FragColor variable (shading/lighting)
        // gl.uniform4f(u_FragColor, rgba[0]*0.5, rgba[1]*0.5, rgba[2]*0.5, rgba[3]);

        // Bottom of cube
        drawTriangle3DNormal([0.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 1.0], [0.0, -1.0, 0.0,   0.0, -1.0, 0.0,   0.0, -1.0, 0.0]);
        drawTriangle3DNormal([0.0, 0.0, 0.0,   0.0, 0.0, 1.0,   1.0, 0.0, 1.0], [0.0, -1.0, 0.0,   0.0, -1.0, 0.0,   0.0, -1.0, 0.0]);
    }
}