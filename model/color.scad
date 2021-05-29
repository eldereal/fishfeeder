color_select = "#e0ffffaa";
// "#e0ffffaa"
// "Black"
// "DarkBlue"
// "Green"
// "Grey"
// "Silver"
// "White"
// "DarkGoldenrod"
// "#fffff1"
// "#fffff2"

module color_if(col) {
    if ($preview || col == color_select) {
        echo ("Color", col);
        color(col)
        children();
    }
}