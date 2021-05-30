color_select = "#e0ffffaa";
// color_select = "Black";
// color_select = "DarkBlue";
// color_select = "Green";
// color_select = "Silver";
// color_select = "White";
// color_select = "DarkGoldenrod";
// color_select = "#fffff1";
// color_select = "#fffff2";

module color_if(col) {
    if ($preview || col == color_select) {
        echo ("Color", col);
        color(col)
        children();
    }
}