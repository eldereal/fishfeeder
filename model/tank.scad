$fn=100;

module tank(cover=false,body=true){
    if (body) {
        color([0.7,0.7,0.7,1])
        difference(){
            cube(size=[392, 228, 300]);
            translate([2, 2, 2])
            cube(size=[388, 224, 300]);
        }
    }
    color([0.3,0.7,0.5,1])
    translate([0,0,300])
    difference(){
        cube(size=[392, 228, 3]);
        translate([392,228,0])
        rotate([0, 0, 45])
        cube(size=[55, 55, 10], center=true);
        
    }

    if (cover) {
        translate([0,0,325])
        cube(size=[372, 228, 10]);
    }
}

tank();