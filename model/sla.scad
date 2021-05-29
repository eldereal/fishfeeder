$eps = 0.01;

module SLA_Shrink_Bottom(l=0.2, d=0.5, n=1, color = 0, max=1000, renderOnly=true) {
    module shrinked() {
        for (i=[1:n]) {
            z=l/n*i;
            h=l/n;

            echo("cut at z=", z, "h=", h);
            translate([0,0,h*(i-1)])
            linear_extrude(height=h+$eps)
            offset(r=-d)
            projection(cut=true) {
                translate([0,0,-z])
                children();
            }
        }
    }
    if (renderOnly && $preview) {
        children();
    } else {
        if (color == 0) {
            shrinked() children();
        } else {
            color(color)
            shrinked() children();
        }
        difference(){
            children();
            translate([0,0,-max/2+l])
            cube(size=[max, max, max], center=true);
        }
    }
}

SLA_Shrink_Bottom(l=1, n=4, renderOnly = false)
cylinder(r1=5, r2=10, h=10, $fn=4);