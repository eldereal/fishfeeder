use <color.scad>

$eps=0.01;

module esp8266(w=26,h=48.3){
    color_if("Black")
    difference(){
        translate([0,0,8.5])
        translate([0,0,1.5/2])
        cube(size=[h, 26, 1.5], center=true);
        
        translate([43/2,20.5/2,8.5-$eps])
        cylinder(r=2.5/2, h=1.5+2*$eps, $fn=16);

        translate([43/2,-20.5/2,8.5-$eps])
        cylinder(r=2.5/2, h=1.5+2*$eps, $fn=16);

        translate([-43/2,20.5/2,8.5-$eps])
        cylinder(r=2.5/2, h=1.5+2*$eps, $fn=16);

        translate([-43/2,-20.5/2,8.5-$eps])
        cylinder(r=2.5/2, h=1.5+2*$eps, $fn=16);
    }

    translate([-h/2+5.5,-25.4/2,0])
    for (i=[0:14]) {
        translate([2.54*i,0,0]){
            color_if("Black")
            translate([0,0,6+$eps])
            cube(size=[2.54, 2.54, 2.5]);
            color_if("Silver")
            translate([2.54/2-0.5/2,2.54/2-0.5/2,0])
            cube(size=[0.5, 0.5, 8.5]);
        }
        translate([2.54*i,2.54*9,0]){
            color_if("Black")
            translate([0,0,6+$eps])
            cube(size=[2.54, 2.54, 2.5]);
            color_if("Silver")
            translate([2.54/2-0.5/2,2.54/2-0.5/2,0])
            cube(size=[0.5, 0.5, 8.5]);
        }
    }
    color_if("Silver")
    translate([h/2-5,-7.5/2,10])
    cube(size=[6, 7.5, 2.7]);

    color_if("#fffff1")
    translate([h/2-10,-7.5/2-2,10])
    cube(size=[1, 2, 1]);

    
    translate([h/2-5, -1.5-12.5/2,10]) {
        color_if("Silver")
        cube(size=[4, 3, 1.5]);
        color_if("Black")
        translate([2,1.5,0])
        cylinder(r=1, h=2.1, $fn=16);
    }

    translate([h/2-5, -1.5+12.5/2,10]) {
        color_if("Silver")
        cube(size=[4, 3, 1.5]);
        color_if("Black")
        translate([2,1.5,0])
        cylinder(r=1, h=2.1, $fn=16);
    }

    translate([0,0,10])
    color_if("Silver")
    translate([-h/2+8,-6,0])
    cube(size=[15, 12, 3.5]);
}

module esp8266_screws(w=26,h=48.3) {
    translate([43/2,20.5/2,8.5-$eps])
    children();

    translate([43/2,-20.5/2,8.5-$eps])
    children();

    translate([-43/2,20.5/2,8.5-$eps])
    children();

    translate([-43/2,-20.5/2,8.5-$eps])
    children();
}

module uln2003(w=35, h=32, sw=29.5, sh=26.5) {
    color_if("Green")
    difference(){
        translate([0,0,1.5])
        translate([0,0,1.5/2])
        cube(size=[w, h, 1.5], center=true);
        
        translate([sw/2,sh/2,1.5-$eps])
        cylinder(r=2.5/2, h=1.5+2*$eps, $fn=16);

        translate([sw/2,-sh/2,1.5-$eps])
        cylinder(r=2.5/2, h=1.5+2*$eps, $fn=16);

        translate([-sw/2,sh/2,1.5-$eps])
        cylinder(r=2.5/2, h=1.5+2*$eps, $fn=16);

        translate([-sw/2,-sh/2,1.5-$eps])
        cylinder(r=2.5/2, h=1.5+2*$eps, $fn=16);
    }

    color_if("Silver") {
        translate([10,10,1.5/2])
        cube(size=[0.5, 0.5, 1.5], center=true);
        translate([10,-10,1.5/2])
        cube(size=[0.5, 0.5, 1.5], center=true);
        translate([-10,-10,1.5/2])
        cube(size=[0.5, 0.5, 1.5], center=true);
        translate([-10,10,1.5/2])
        cube(size=[0.5, 0.5, 1.5], center=true);
    }

    color_if("White")
    translate([w/2-6-10,h/2-15-1,3])
    difference(){
        cube(size=[6, 15, 7]);
        translate([0.8,0.8,0.8])
        cube(size=[6-2*0.8, 15-2*0.8, 7-0.8+$eps]);
    }

    color_if("Black")
    translate([w/2-6-10-10,h/2-20-1,3])
    cube(size=[10, 20, 9]);

    for (i=[0:3])
    translate([-w/2+5.5,h/2-2.54-5-2.54*i,3]) {
        color_if("Black")
        cube(size=[2.54, 2.54, 2.54]);
        color_if("Silver")
        translate([2.54/2-0.5/2,2.54/2-0.5/2,0])
        cube(size=[0.5,, 0.5, 8]);
    }

    color_if("#fffff2")
    for (i=[0:3])
    translate([w/2-1.5-4,h/2-1.5-3.5-14/3*i,3])
    cylinder(r=1.5, h=5.5);

    for (i=[0:3])
    translate([-w/2+9+2.54*i,-h/2+3,3]) {
        color_if("Black")
        cube(size=[2.54, 2.54, 2.54]);
        color_if("Silver")
        translate([2.54/2-0.5/2,2.54/2-0.5/2,0])
        cube(size=[0.5,, 0.5, 8]);
    }
}

translate([0,50,0])
esp8266();

translate([0,0,0])
uln2003();
