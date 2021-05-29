use <color.scad>

$fn=100;

module stepper(){
translate([0, 8, 0]) {
    //机体
    color_if("Silver")
    translate([0, 0, -19])
    cylinder(r=14, h=19);
    
    //电线盒
    color_if("DarkBlue")
    translate([-7.5, 0, -16.1])
    cube(size=[15, 17, 16]);
    
    //电线
    color_if("Silver")
    translate([0, 16, -2])
    rotate([-90, 0, 0]){
        for (i=[-2:2]) {
            translate([i, 0, 0]) cylinder(r=0.5, h=10);
        }
    }

    //输出轴
    
    translate([0, -8, 0])
    union(){
        color_if("Silver")
        cylinder(r=5, h=1, center=false);

        color_if("DarkGoldenrod")
        intersection(){
            cylinder(r=2.5, h=10);
            translate([0, 0, 5])
            cube(size=[5, 3, 10], center=true);
        }
        color_if("DarkGoldenrod")
        cylinder(r=2.5, h=4);
    }

    //法兰
    color_if("Silver")
    translate([0, 0, -1])
    difference(){
        union(){
            translate([17, 0, 0])
            cylinder(r=3.5, h=1);
            translate([-17, 0, 0])
            cylinder(r=3.5, h=1);
            translate([-17, -3.5, 0])
            cube(size=[34, 7, 1]);
        }
        translate([17, 0, -0.5])
        cylinder(r=2, h=2);
        translate([-17, 0, -0.5])
        cylinder(r=2, h=2);
    }
}
}

module stepper_screws() {
    
    translate([17, 8, -1.5])
    children();
    translate([-17, 8, -1.5])
    children();
}

stepper();

module connector(){
translate([0,0,0])
    difference(){
        cylinder(r=4, h=10);
        
        translate([0,0,5.1])
        intersection(){
            translate([0, 0, -0.1])
            cylinder(r=2.5, h=5.1);
            translate([-2.5, -1.5, -0.1])
            cube(size=[5, 3, 5.1]);
        }

        intersection(){
            translate([0, 0, -0.1])
            cylinder(r=1.5, h=5.2);
            translate([-1.5, -1, -0.1])
            cube(size=[3, 2.5, 5.2]);
        }

    }
    
}

// translate([0, 0, 22])
// rotate([0, 180, 0])
// connector();