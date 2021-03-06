use <main.scad>
use <sla.scad>

module main_with_support(){

    SLA_Shrink_Bottom()
    translate([0,0,29])
    rotate([180, 0, 0])
    main();

    translate([14+12,14,0])
    cube(size=[25, 25, 0.2]);

    translate([14+12,-14-25,0])
    cube(size=[25, 25, 0.2]);

    translate([20+12,0,0])
    rotate([0, 0, -45])
    cube(size=[25, 25, 0.2]);
}

// main_with_support();

// SLA_Shrink_Bottom()
// translate([0, 0, 15])
// rod();

// SLA_Shrink_Bottom()
// cover();

cube(size=[10, 10, 0.2]);