/*
Mariah Balandran
mbalandr@ucsc.edu

Notes to Grader:
Followed video tutorial playlist provided at the top of the assignment.
Copied from cube.js. Used ChatGPT to debug sphere drawTriangle issues.
*/

class Sphere {
    constructor() {
        this.type = 'sphere';
        // this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        // this.size = 5.0;
        this.segments = 6;
        // this.rotation = Math.random() * 360;
        this.matrix = new Matrix4();
        this.colorNum = -1;
        this.specON = true;
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

        var d = Math.PI/this.segments;
        var dd = Math.PI/this.segments;

        for (var t = 0; t < Math.PI; t += d) {
            for (var r = 0; r < (2 * Math.PI); r += d) {
                var p1 = [Math.sin(t) * Math.cos(r), Math.sin(t) * Math.sin(r), Math.cos(t)];

                var p2 = [Math.sin(t+dd) * Math.cos(r), Math.sin(t+dd) * Math.sin(r), Math.cos(t+dd)];
                var p3 = [Math.sin(t) * Math.cos(r+dd), Math.sin(t) * Math.sin(r+dd), Math.cos(t)];
                var p4 = [Math.sin(t+dd) * Math.cos(r+dd), Math.sin(t+dd) * Math.sin(r+dd), Math.cos(t+dd)];

                // var v = [];
                // v = v.concat(p1);
                // v = v.concat(p2);
                // v = v.concat(p4);

                // gl.uniform4f(u_FragColor, 1, 1, 1, 1);
                // drawTriangle3DNormal(v, v);

                // v = v.concat(p1);
                // v = v.concat(p4);
                // v = v.concat(p3);

                // gl.uniform4f(u_FragColor, 1, 1, 1, 1);
                // drawTriangle3DNormal(v, v);

                var v1 = [].concat(p1, p2, p4);
                var n1 = [].concat(p1, p2, p4);
                drawTriangle3DNormal(v1, n1);

                var v2 = [].concat(p1, p4, p3);
                var n2 = [].concat(p1, p4, p3);
                drawTriangle3DNormal(v2, n2);
            }
        }
    }
}