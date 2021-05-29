use <Nut_Job.scad>

module cap_threads(){
    difference(){
        cylinder(r=21, h=7);
        translate([0,0,-$eps])
        cylinder(r=18, h=7+2*$eps);
        translate([0,0,-$eps])
        intersection(){
            cylinder(r=19,h=7+2*$eps);
            screw_thread(
                48.5,    // Outer diameter of the thread
                7+2*$eps,     // Step, traveling length per turn, also, tooth height, whatever...
                30,    // Degrees for the shape of the tooth 
                                //   (XY plane = 0, Z = 90, btw, 0 and 90 will/should not work...)
                5,   // Length (Z) of the tread
                PI/2,  // Resolution, one face each "PI/2" mm of the perimeter, 
                -2      //Countersink style
            );
        }
    }
}

module bottle() {
    cylinder(r=15,h=30);
    translate([0,0,40+20])
    sphere(r=40);
}

module bottle_cap(){
    if (!$preview) {
        translate([0,0,4.5]) {
            cap_threads();
            rotate([0, 0, 180])
            cap_threads();
        }
    }

    difference(){
        cylinder(r=21, h=12);
        translate([0,0,2])
        cylinder(r=19, h=10+$eps);
    }
    // intersection(){
    //     difference(){
    //         cylinder(r=15, h=7);

    //         translate([0,0,2])
    //         cylinder(r=14, h=5+$eps);
    //     }
    //     cylinder(r1=17,r2=14,h=7);
    // }
}