use <tank.scad>
use <stepper.scad>
use <gear.scad>
use <sla.scad>
use <bottle.scad>
use <MCAD/screw.scad>
use <chips.scad>
use <color.scad>

$fn=$preview ? 16 : 128;
$delta = 0.1;
$gap = 0.25;
$eps = 0.01;

$dev = false;

module outer_gear(n,h,s=0.2){
    gear(number_of_teeth=2*n,
        circular_pitch=90,
        hub_thickness=0,
        rim_thickness=h,
        gear_thickness=h,
        bore_diameter=0,
        // twist=dir*200/n,
        backlash=s
    );
}

module inner_gear(n,h,d,p=0){
    rotate([0, 0, 180*p/n])
    difference(){
        cylinder(r=d/2,h=h);
        translate([0,0,-1])
        gear(number_of_teeth=2*n,
            circular_pitch=90,
            hub_thickness=0,
            rim_thickness=h+2,
            gear_thickness=h+2,
            bore_diameter=0,
            // twist=dir*200/n,
            backlash=0,
            dir=-1,
            p=p
        );
    }
    
}


module stepper_gear(){
    difference(){
        union(){
            cylinder(r=5,h=3);
            translate([0,0,3])
            outer_gear(n=14,h=3);
        }
        intersection() {
            translate([0,0,1])
            cube(size=[5, 3, 4], center=true);
            translate([0,0,-1])
            cylinder(r=2.5,h=4);
        }
        translate([0,0,2])
        cylinder(r=2.5,h=5);

        translate([0,0,4])
        cylinder(r=5,h=3);
        
    }
    
    difference(){
        union(){
            
            // translate([0,0,1.8])
            // intersection(){
            //     outer_gear(n=14,h=0.2,s=0.6);
            //     cylinder(r=7.4,h=0.2);
            // }
        }
        
    }
}


module container(){
difference()
{
    // {
        union(){
            inner_gear(n=60,d=80,h=3,p=1);
            translate([0,0,3])
            difference(){
            cylinder(r1=40,r2=40, h=10);
            translate([0,0,-1])
            cylinder(r=30, h=12);
            }
        }
        

        
    // }
    l=$dev?0:11;
    for (i=[0:l]) {
        rotate([0, 0, 30*i]) {
            translate([0,35,-1])
            cylinder(r=3, h=5);

            difference(){
                hull()
                {
                    
                    translate([0,35,3])
                    cylinder(r=3, h=1);

                    translate([0,0,13]) {
                        difference(){
                            intersection(){
                                difference(){
                                    cylinder(r=38, h=1);
                                    translate([0,0,-1])
                                    cylinder(r=32, h=3);
                                }
                        
                                rotate([0, 0, 75])
                                cube([48,48,1]);
                                rotate([0, 0, 15])
                                cube([48,48,1]);
                            }
                            rotate([0, 0, 15])
                            translate([-1,0,-1])
                            cube(size=[2, 52, 3]);

                            rotate([0, 0, -15])
                            translate([-1,0,-1])
                            cube(size=[2, 52, 3]);
                        }
                    }
                }
                cylinder(r=32, h=20);
                
            }
        }
        
    }
    

    // difference(){
    //     cylinder(r=76/2, h=3);
    //     translate([0,0,-1])
    //     cylinder(r=72/2, h=5);
    // }

    // for (i=[0:11]) {
    //     rotate([0, 0, 30*i+15])        
    //     translate([-1, 64/2-1, 0])
    //     cube(size=[2, 6, 3]);    
    // }
    
    
}
}


module foundation(){
    wall = $dev ? 3 : 16;
    color_if([0.8,0.4,0.2])
    translate([0,0,0]){
    difference(){
        union(){
            cylinder(r=42, h=wall);
        }
        translate([0,0,3])
        cylinder(r=40.2, h=16);

        translate([0,23,-1])
        cylinder(r=5.2, h=5);

        translate([0,35,-1])
        cylinder(r=3, h=5);

        translate([17,15,-1])
        cylinder(r=1.5,h=5);

        translate([17,15,-1])
        cylinder(r=3,h=4);

        translate([-17,15,-1])
        cylinder(r=1.5,h=5);

        translate([-17,15,-1])
        cylinder(r=3,h=4);
    }

    translate([17,15,3])
    difference(){
        cylinder(r=5,h=3);
        translate([0,0,-1])
        cylinder(r=1.5,h=5);
    }

    translate([-17,15,3])
    difference(){
        cylinder(r=5,h=3);
        translate([0,0,-1])
        cylinder(r=1.5,h=5);
    }

    }
}



// translate([0,60,0])
// translate([-392,-228,-303])
// tank(cover=false, body=true);

// bottle();

module rod(){
    $gap=0.5;
    translate([0,0,9])
    auger(10, 12, 5-$gap, 1.5);

    translate([0,0,-15])
    difference(){
        union(){
            cylinder(r=5-$gap, h=24+$eps);
            cylinder(r=7-$gap, h=3);
        }

        translate([0,0,-$eps])
        rotate([0,0,90])
        intersection(){
            cylinder(r=2.5+$gap, h=7);
            translate([-2.5-$gap, -1.5-$gap, 0])
            cube(size=[5+$gap*2, 3+$gap*2, 10]);
        }
    }
}

module m3_conn(h=3){
    scale([1, 0.75, 1]) 
    difference(){
        union(){
            cylinder(r=1.5-$gap, h=h+$eps);
            
            translate([0,0,h])
            cylinder(r1=1.5-$gap, r2=1.5+$gap, h=1);
            translate([0,0,h+1])
            cylinder(r1=1.5+$gap, r2=0.5, h=2);    
            
        }

        translate([-0.5,-2-$eps,0])
        cube(size=[1, 4+2*$eps, h+3+$eps]);
    }
}

module main(showUln2003=true){
    
    move = 12;

    difference(){
        union(){
            
            translate([move,0,7])
            cylinder(r1=5, r2=21, h=10);

            intersection(){
                rotate([0, 90, 0])
                translate([0,0,-9])
                cylinder(r=7,h=31);

                translate([-21,-21,-17])
                cube(size=[42, 42, 46]);
                // #cylinder(r=21,h=34);
            }

            intersection(){
                union(){
                    translate([-12,-7,-17])
                    cube(size=[42, 14, 17]);

                    translate([-12,-1.5, 0])
                    cube(size=[42, 3, 29]);
                }
                translate([-21,-21,-17])
                cube(size=[42, 42, 46]);
                // #cylinder(r=21,h=34);
            }

            translate([move,0,-7])
            cylinder(r=5,h=17+$eps);

            translate([-9-3,-21,-45])
            cube(size=[3, 42, 29+45]);
            
        }

        rotate([0, 90, 0])
        translate([0,0,-20])
        cylinder(r=5,h=60);
        
        translate([move,0,0])
        cylinder(r=3,h=17+2*$eps);

        translate([move,0,8+$eps])
        cylinder(r1=3, r2=19, h=10);

        translate([move,0,18])
        cylinder(r=19, h=11+$eps);

        translate([-9,-8, -18])
        cube(size=[25, 16, 11]);

        translate([-7+$eps,17,-8])
        rotate([0, -90, 0])
        cylinder(r=1.5+$gap, h=5+2*$eps);

        translate([-7+$eps,-17,-8])
        rotate([0, -90, 0])
        cylinder(r=1.5+$gap, h=5+2*$eps);

        translate([-7+$eps,-16,-8-17-16])
        rotate([0, -90, 0])
        cylinder(r=1.5+$gap, h=5+2*$eps);

        translate([-7+$eps,16,-8-17-16])
        rotate([0, -90, 0])
        cylinder(r=1.5+$gap, h=5+2*$eps);
        
    }

    translate([move, 0, 0])
    difference(){
        translate([0,0,17-$eps])
        bottle_cap();
        translate([0,0,8+$eps])
        cylinder(r1=5, r2=19, h=10);
        translate([0,0,18])
        cylinder(r=19,h=1+$eps);
    }

    
    rotate([-180, 0, 0]) 
    translate([0,0,-29])
    { 
        difference(){
            translate([-62, -21, 0])
            cube([62+move, 42, 2]);
            translate([move,0, -$eps])
            cylinder(r=19, h=2+2*$eps);
        }

        translate([-62, -21, 2])
        cube(size=[2, 42, 2]);

    
        translate([-39,0,2])
        rotate([0, 0, 180]){
            if ($preview && showUln2003) {
                uln2003();
            }
            translate([0,0,-$eps]) {
                translate([29.5/2,26.5/2,0])
                m3_conn(h=5);
                translate([29.5/2,-26.5/2,0])
                m3_conn(h=5);
                translate([-29.5/2,26.5/2,0])
                m3_conn(h=5);
                translate([-29.5/2,-26.5/2,0])
                m3_conn(h=5);
            }
        }
    }
}

module cover(){

    {
        difference(){
            translate([-36,-19, 0])
            cube(size=[61, 38, 2]);
            translate([43/2,20.5/2,-$eps])
            cylinder(r=1.5, h=2+2*$eps);

            translate([43/2,-20.5/2,-$eps])
            cylinder(r=1.5, h=2+2*$eps);

            translate([-43/2,20.5/2,-$eps])
            cylinder(r=1.5, h=2+2*$eps);

            translate([-43/2,-20.5/2,-$eps])
            cylinder(r=1.5, h=2+2*$eps);
            
            translate([0,0,17])
            rotate([0, 180, 180]) {
                translate([49/2-5+3,-6,10-(6-2.7)/2])
                cube(size=[6, 12, 6]);

                translate([48.3/2-5, -1.5-12.5/2,10]) {
                    translate([2,1.5,0])
                    cylinder(r=1.5, h=10);
                }
                translate([48.3/2-5, -1.5+12.5/2,10]) {
                    translate([2,1.5,0])
                    cylinder(r=1.5, h=10);
                }
            }
        }

        difference(){
            translate([25,-19,0])
            cube(size=[2, 38, 48]);

            translate([0,0,17])
            rotate([0, 180, 180]) {
                translate([49/2-5+3,-6,10-(6-2.7)/2])
                cube(size=[6, 12, 6]);
            }
        }

        for (i=[0:1])
        mirror([0, i, 0])        
        translate([26,-16,48]) 
        difference(){
            intersection()
            {
                rotate([0, 45, 0])
                cube(size=[14, 10, 14], center=true);

                translate([0,-5,-20])
                cube(size=[20, 10, 20]);
            }

            translate([0,-3-$eps,-22])
            cube(size=[20, 6, 20]);

            translate([6,0,-5])
            cylinder(r=1.5,h=10);
        }

        for (i=[0:1])
        mirror([0, i, 0])
        difference(){
            translate([-36, -21, 0])
            cube(size=[63, 2, 48]);

            translate([-1,-17,39])
            cylinder(r=3.7,h=10);
        }
    }
}

module assemble(){

difference(){
    union(){
        
        translate([0,0,29])
        rotate([180, 0, 0]) {
            

            color_if("#e0ffffaa") 
            main();

            rotate([-180, 0, 0]) 
            translate([0,0,-29])
            translate([-39,0,2])
            rotate([0, 0, 180])
            uln2003();
            

            
            // translate([-27,0,0])
            translate([-19,0,0])
            rotate([-90, 0, -90]) {
                stepper();
                color_if("Silver")
                stepper_screws() {
                    cylinder(r=1.5, h=10);
                    cylinder(r=2, h=1);
                }
            }
            
            
        }
        

        // difference(){
        //     cube(size=[50, 50, 0.5], center=true);
        //     cylinder(r=19.5, h=1, center=true);
        // }

        
    }
    // if ($preview) {
    //     translate([0,500,0])
    //     cube(size=[1000, 1000, 1000], center=true);
    // }
}


translate([-60, 0, 38])
rotate([180, 0, 0]) 
rotate([0, 90, 0]) 
translate([0,0,17])
rotate([0, 180, 180]){
    esp8266();
    color_if("Silver")
    esp8266_screws() {
        cylinder(r=1.5, h=9);
        translate([0,0,9])
        cylinder(r=2,h=1);
    }
}

color_if("#e0ffffaa")
translate([-60, 0, 38])
rotate([180, 0, 0]) 
rotate([0, 90, 0])
cover();

}

// rotate([0, 0, -$t*360])
rotate([0, 180, 0])
assemble();



// SLA_Shrink_Bottom()
// translate([0, 0, 15])
// rod();
rotate([0, 180, 0])
translate([0,0,29])
rotate([180, 0, 0])
rotate([0, 90, 0])
color_if("DarkGoldenrod")
rod();

