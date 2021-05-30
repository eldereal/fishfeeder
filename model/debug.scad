use <main.scad>

difference(){
    main(showUln2003=false);

    translate([-100, -50, -100])
    cube(size=[200, 50, 200]);
}


rotate([180, 0, 0])
rotate([0, 90, 0])
rod();
