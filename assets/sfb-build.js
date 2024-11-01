(function($) {
(function(wp) {
    wp.domReady(function() {

        'use strict';

        // Main
        var _components = wp.components;
        var _data = wp.data;
        var _compose = wp.compose;

        // Plugin
        var registerPlugin = wp.plugins.registerPlugin;
        var PluginSidebar = wp.editPost.PluginSidebar;
        var el = wp.element.createElement;

        // Components
        var Panel = _components.Panel;
        var PanelBody = _components.PanelBody;
        var PanelRow = _components.PanelRow;
        var BaseControl = _components.BaseControl;
        var RangeControl = _components.RangeControl;
        var SelectControl = _components.SelectControl;
        var RadioControl = _components.RadioControl;
        var TextControl = _components.TextControl;
        var ColorPicker = _components.ColorPicker;
        var Popover = _components.Popover;
        var Button = _components.Button;
        var Dashicon = _components.Dashicon;

        // Other
        var withSelect = _data.withSelect;
        var withState = _compose.withState;
        var withDispatch = _data.withDispatch;
        var compose = _compose.compose;

        // Append Data
        $("body").append("<div id='sfb-data'>" + getStyleData() + "</div>");


        // Plugin Variables
        var sfb = {};

        // Data
        sfb.data = $("#sfb-data");


        // Select Number input
        $(document).on("click", ".sfb-sidebar-content input[type='number']", function() {
            this.select();
        });


        // Get CSS rules and covert to style data
        function getStyleData(input, thisClass) {

            // Variables
            var _css, inputRegex;

            // No input
            if (input == undefined || input == null) {

                // Direct from data
                _css = _data.select("core/editor").getCurrentPost().meta.sfb_css;

            } else {

                // From param
                _css = input;

                // CSS from input
                inputRegex = new RegExp("\." + thisClass + "\{(.*?)\}", "g");

                // Get CSS
                _css += GetCSSByClass("all").replace(inputRegex, "");

            }

            // Output HTML
            var output = "";

            // Checks if available
            if (_css != null && _css != "") {

                // Get groups
                var CSSgroupList = _css.match(/\.sfb-style-\d+\{(.*?)\}/g);

                // look groups
                for (var i = 0; i < CSSgroupList.length; i++) {

                    // Get this group
                    var thisGroup = CSSgroupList[i];
                    thisClass = thisGroup.match(/^\.sfb-style-\d+/g)[0].replace(/\./g, "");

                    // Skip
                    if (thisGroup.indexOf(";") == -1 || thisGroup.indexOf(":") == -1) {
                        continue;
                    }

                    // Geting rules of this group
                    var rules = thisGroup.split("." + thisClass + "{")[1].split(/\}$/g)[0].replace(/ \!important/g, "").split(";");

                    // Loop rules to insert
                    for (var r = 0; r < rules.length; r++) {

                        // If is not valid
                        if (rules[r].length == 0) {
                            continue;
                        }

                        // Can't read the data
                        if (rules[r].match(/^(.*?)\:/) == null) {
                            continue;
                        }

                        // Get this rule
                        var thisRule = rules[r].match(/^(.*?)\:/)[0].replace(/\:$/, "");
                        var thisValue = rules[r].replace(thisRule + ":", "");

                        // Style Tag
                        var styleContent = "." + thisClass + "{" + thisRule + ": " + thisValue + " !important;}";

                        // Append Style
                        output += "<style data-class='" + thisClass + "' id='" + thisClass + "-" + thisRule + "'>" + styleContent + "</style>";

                    }

                }

            }

            return output;

        }


        // Get Matchless Number For Block Style Class
        var GetmatchlessNumber = function() {

            var length = 1,
                number;

            while (length > 0) {

                // Create 1000 - 2000
                number = Math.floor(Math.random() * 1000) + 1000;

                // Checks
                length = sfb.data.find("[data-class='sfb-style-" + number + "']").length;

            }

            return number;

        };

        // Insert CSS Rule
        function insertRule(rule, id, value, type) {

            // Empty is 0
            if (type == "number") {

                // No empty but zero
                if (value == "" || value == "px") {
                    value = "0";
                }

            }

            // Variables
            var thisClass, availableStyle, styleContent, shadowColor;

            // Create auto class or get available one
            thisClass = sfb_block_auto_class();

            // Box shadow API
            if (rule == "box-shadow") {

                // start empty
                var valueShadow = "";

                $(".sfb-box-shadow-group input").each(function() {

                    // Get box-shadow-value
                    var v = $(this).val();

                    // Default 0 if empty
                    if (v == "") {
                        v = "0";
                    }

                    // Generate value
                    valueShadow += v + "px ";

                });

                // Get shadowColor
                if (id == "box_shadow_color") {
                    shadowColor = value;
                } else {
                    shadowColor = $(".sfb-box-shadow-group .sfb-box_shadow_color-color-box span").css("background-color");
                }

                // Add
                value = valueShadow + shadowColor;

            }

            // Line-height as em
            if (rule == "line-height") {
                var baseFontSize = parseFloat($("." + thisClass).parent().css("font-size"));
                value = parseFloat(value) / baseFontSize;
            }

            // Update color box
            if (type == "color") {

                // color is value as default
                var color = value;

                // Use shadowColor var if box-shadow-color
                if (id == "box_shadow_color") {
                    color = shadowColor;
                }

                // Update Box Color
                $(".sfb-" + id + "-color-box span").css("background-color", color);

            }

            // Find
            availableStyle = sfb.data.find("#" + thisClass + "-" + rule);

            // Style Tag
            styleContent = "." + thisClass + "{" + rule + ": " + value + " !important;}";

            // Append New One
            if (availableStyle.length == 0) {
                sfb.data.append("<style data-class='" + thisClass + "' id='" + thisClass + "-" + rule + "'>" + styleContent + "</style>");

                // Update Content
            } else {
                availableStyle.html(styleContent);
            }

            // Update it
            $("#sfb-css-editor").val(GetCSSByClass(thisClass));

            // Save CSS
            _data.dispatch('core/editor').editPost({
                meta: {
                    "sfb_css": get_sfb_styles(),
                },
            });


        }


        // Get all styles by class
        // Unused, keeping for a future feature.
        function GetCSSByClass(thisClass) {

            // Get this class
            var selector;
            if (thisClass == undefined || thisClass == null) {

                // Get selector
                selector = $(".is-selected [class*='sfb-style-']");

                // No selected, no data
                if (selector.length == 0) {
                    return "";
                }

                // Get thisClass
                thisClass = selector.attr("class").match(/(^|\s)sfb-style-(\d)+(\s|$)/g)[0].replace(/\s+/g, "");

            }

            var _css = "";
            var CSSgroupList;

            // Get groups
            if (thisClass == "all") {
                CSSgroupList = sfb.data.find("[data-class]");
            } else {
                CSSgroupList = sfb.data.find("[data-class='" + thisClass + "']");
            }

            // look groups
            CSSgroupList.each(function() {

                // Get this group
                var thisGroup = $(this).html();

                if (thisClass != "all") {

                    // Geting rules of this group
                    var rules = thisGroup.split("." + thisClass + "{")[1].split(/\}$/g)[0].replace(/ \!important/g, "").split(";");

                    // Loop rules to insert
                    for (var r = 0; r < rules.length; r++) {

                        // If is not valid
                        if (rules[r].length == 0) {
                            continue;
                        }

                        _css += "\t" + rules[r] + ";\n";

                    }

                } else {

                    _css += thisGroup;

                }

            });

            // clean tabs
            _css = _css.replace(/ +/g, " ").replace(/\t/g, "");

            return _css;

        }


        // Get all applied CSS styles
        function get_sfb_styles() {

            // Create empty variable
            var _css = "";
            var _doneClass = [];

            // Variables
            var styleContent, style, thisClass;

            // Get styles
            sfb.data.find("style").each(function() {

                // Get style
                style = $(this);
                thisClass = style.attr("data-class");

                // Skip it if already inserted
                if (_doneClass.indexOf(thisClass) != -1) {
                    return true;
                }

                // DoneClass
                _doneClass.push(thisClass);

                // Add selector
                _css += "." + thisClass + "{";

                // Find all other similar classes
                sfb.data.find("style[data-class='" + thisClass + "']").each(function() {

                    // Get Content
                    styleContent = $(this).html().split("." + thisClass + "{")[1].split(/\}$/g)[0].replace(/ \!important/g, "");

                    // Add it
                    _css += styleContent;

                });

                // Close selector
                _css += "}";

            });

            // Return CSS
            return _css.replace(/ +/g, " ");

        }


        // Read CSS Value
        function readValue(rule, type, id) {

            // This Selector
            var selector = $(".is-selected [class*='sfb-style-']");

            // Setting border-style to read data
            if (id == "border_width") {

                // Insert border-style if empty
                if (selector.css("border-top-style") == "none") {
                    selector.addClass("sfb-border-style");
                }

            }

            // Not possible to read directly
            if (rule == "border-color") {
                rule = "border-top-color";
            }
            if (rule == "border-style") {
                rule = "border-top-style";
            }
            if (rule == "border-width") {
                rule = "border-top-width";
            }

            // Get Value
            var value = selector.css(rule);

            // Setting border-style to read data
            if (id == "border_width") {

                // Insert border-style if empty
                selector.removeClass("sfb-border-style");

                // Default is 0
                if (value == "3px" && selector.css(rule) == "0px") {
                    value = "0px";
                }

                // More than 0 mean is edited
                if (parseFloat(value) > 0) {

                    // Add solid if not.
                    if (selector.css("border-top-style") == "none") {
                        insertRule("border-style", "border_style", "solid", "text");
                    }

                }

            }

            // Transparent to white
            if (type == "color") {

                // No Color, default is color
                if (value == "" || value == undefined) {
                    value = selector.css("color");
                }

            }

            // No continue if undefined
            if (value == undefined) {
                return value;
            }

            // Fix font-family bug
            if (rule == "font-family") {

                value = value.replace(/\,\s/g, ",").replace(/\"/g, "\'");

            }

            // Box shadow: pixels
            if (rule == "box-shadow" && id != "box_shadow_color") {
                value = value.replace(/\#(.*?)(\s|$)/g, ""); // Delete hex
                value = value.replace(/rgba?\((.*?)\)(\s|$)/g, ""); // Delete rgb
                value = $.trim(value.replace(/\s+/g, " ")); // delete extra spaces
                value = value.split(" ");
            }

            // Box shadow Color
            if (id == "box_shadow_color") {

                var hex = value.match(/\#(.*?)(\s|$)/g);
                var rgb = value.match(/rgba?\((.*?)\)(\s|$)/g);

                // Get Hex
                if (hex != null) {
                    if (hex.length > 0) {
                        value = hex[0];

                    }
                }

                // Get Rgba
                if (rgb != null) {
                    if (rgb.length > 0) {
                        value = rgb[0];
                    }
                }

                // None to color
                if (value == "none" || value == "transparent" || value == "rgba(0,0,0,0)" || value == "rgba(0, 0, 0, 0)" || value == "rgba(255, 255, 255, 0)") {
                    value = selector.css("color");
                }
            }

            // Box shadow X
            if (id == "box_shadow_x") {
                value = value[0];
            }

            // Box shadow Y
            if (id == "box_shadow_y") {
                value = value[1];
            }

            // Box shadow Blur
            if (id == "box_shadow_blur") {
                value = value[2];
            }

            // Box shadow Spread
            if (id == "box_shadow_spread") {
                value = value[3];
            }

            // Transparent to white
            if (type == "color") {

                // Use white as transparent
                if (value == "transparent" || value == "rgba(0,0,0,0)" || value == "rgba(0, 0, 0, 0)" || value == "rgba(255, 255, 255, 0)") {
                    value = "#FFFFFF";
                }

            }

            // Clean non-numbers
            if (type == "number") {

                value = parseFloat(value);

                if (value == 0) {
                    value = "";
                }

            }

            // 1 * 100 = 100
            if (rule == "opacity") {
                value = value * 100;
            }

            return value;

        }


        // Custom: Radio
        var sfbRadio = compose(

            // Appling
            withDispatch(function(dispatch, props) {
                return {

                    setValue: function(value) {

                        // Insert Rule
                        insertRule(props.rule, props.id, value, "text");

                    }
                };
            }),

            // Reading
            withSelect(function(select, props) {
                return {

                    value: readValue(props.rule, "text", props.id),

                };
            })

            // Option
        )(function(props) {

            return el(BaseControl, {
                    id: props.id,
                    label: props.label,
                    help: props.help,
                    className: "sfb-radio-group",
                },

                el(RadioControl, {
                        selected: props.value,
                        options: props.options,
                        onChange: function(content) {
                            props.setValue(content);
                        },

                    }

                )

            );

        });



        // Custom: Select
        var sfbSelect = compose(

            // Appling
            withDispatch(function(dispatch, props) {
                return {

                    setValue: function(value) {

                        // Insert Rule
                        insertRule(props.rule, props.id, value, "text");

                    }
                };
            }),

            // Reading
            withSelect(function(select, props) {
                return {

                    value: readValue(props.rule, "text", props.id),

                };
            })

            // Option
        )(function(props) {

            return el(BaseControl, {
                    id: props.id,
                    label: props.label,
                    help: props.help,
                },

                el(SelectControl, {
                        value: props.value,
                        options: props.options,
                        onChange: function(content) {
                            props.setValue(content);
                        },
                    }

                )

            );

        });




        // Custom: Slider
        var sfbSlider = compose(

            // Appling
            withDispatch(function(dispatch, props) {
                return {

                    setValue: function(value) {

                        // 100/1
                        if (props.rule == "opacity") {
                            value = value / 100;
                        }

                        // Insert Rule
                        insertRule(props.rule, props.id, value + "" + props.unit, "number");

                    }
                };
            }),

            // Reading
            withSelect(function(select, props) {
                return {

                    value: readValue(props.rule, "number", props.id),

                };
            })

            // Option
        )(function(props) {

            return el(BaseControl, {
                    id: props.id,
                    label: props.label,
                    help: props.help,
                },

                el(RangeControl, {
                        value: props.value,
                        min: props.min,
                        max: props.max,
                        onChange: function(content) {
                            props.setValue(content);
                        },
                    }

                )

            );

        });



        // Custom: Number
        var sfbNumber = compose(

            // Appling
            withDispatch(function(dispatch, props) {
                return {

                    setValue: function(value) {

                        // 100/1
                        if (props.rule == "opacity") {
                            value = value / 100;
                        }

                        // Insert Rule
                        insertRule(props.rule, props.id, value + props.unit, "number");

                    }
                };
            }),

            // Reading
            withSelect(function(select, props) {
                return {

                    value: readValue(props.rule, "number", props.id),

                };
            })

            // Option
        )(function(props) {

            return el(BaseControl, {
                    id: props.id,
                    label: props.label,
                    help: props.help,
                },

                el(TextControl, {
                        value: props.value,
                        placeholder: 0,
                        type: "number",
                        onChange: function(content) {
                            props.setValue(content);
                        },
                    }

                )

            );

        });


        // Custom: Color
        var sfbColor = compose(

            // Option
        )(function(props) {

            return el(BaseControl, {
                    id: props.id,
                    label: props.label,
                    help: props.help,
                },

                el(ColorPopover, {
                    rule: props.rule,
                    id: props.id,
                })

            );

        });


        // Custom: ColorPopover    
        var ColorPopover = withState({

            isVisible: false // Default close

            // Functions
        })(function(props) {

            // Variables
            var isVisible = props.isVisible;
            var setState = props.setState;

            var readVal = readValue(props.rule, "color", props.id);

            // Create button
            return el(Button, {
                    className: "sfb-color-box sfb-" + props.id + "-color-box",
                    onClick: function(e) {

                        // Get target
                        var thisTarget = $(e.target);

                        // This Target
                        if (thisTarget.hasClass("sfb-color-box") || thisTarget.hasClass("sfb-color-box-span")) {

                            setState(function(state) {
                                return {
                                    isVisible: !state.isVisible
                                };
                            });

                        }

                    },

                    // Show picker if visible
                }, isVisible && el(Popover, null,

                    // Picker
                    el(SfbPicker, {
                        rule: props.rule,
                        id: props.id,
                        color: readVal,
                    })

                ),
                el("span", {
                    class: "sfb-color-box-span",
                    style: {
                        backgroundColor: readVal,
                    },
                })
            );
        });


        // Custom: ColorPicker    
        var SfbPicker = withState(function(select, props) {
            return {
                color: "#FFFFFF", // Default
            };

            // Functions
        })(function(props) {

            var color = props.color;
            var rule = props.rule;
            return el(ColorPicker, {
                color: color,
                onChangeComplete: function onChangeComplete(value) {

                    // Hex insert
                    if (value.rgb.a == 1) {
                        insertRule(rule, props.id, value.hex, "color");

                        // Rgba insert
                    } else {
                        insertRule(rule, props.id, "rgba(" + value.rgb.r + ", " + value.rgb.g + ", " + value.rgb.b + ", " + value.rgb.a + ")", "color");
                    }

                }
            });
        });



        // Sidebar selection card
        function sfb_selection_card(props) {

            // Get Current Block
            var block = _data.select('core/block-editor').getSelectedBlock();

            // No Block            
            if (block == null) {

                return el("span", {
                    class: "editor-block-inspector__no-blocks block-editor-block-inspector__no-blocks"
                }, "Select a block to style.");

            }

            // Get Information
            var blockInformation = {
                icon: "",
                title: "",
                description: "",
            };


            // Checks Blocks
            wp.blocks.getBlockTypes().forEach(function(thisBlock) {

                // Get details
                if (thisBlock.name == block.name) {
                    blockInformation.icon = thisBlock.icon;
                    blockInformation.title = thisBlock.title;
                    return false;
                }

            });


            // Selected card
            return el('div', {
                    className: 'block-editor-block-card sfb-block-card'
                },

                el('span', {
                        className: 'editor-block-icon block-editor-block-icon'
                    },

                    blockInformation.icon.src

                ),

                el('div', {
                        className: 'block-editor-block-card__content'
                    },

                    el('div', {
                            className: 'block-editor-block-card__title'
                        },
                        blockInformation.title
                    ),

                    el('div', {
                            className: 'block-editor-block-card__description'
                        },
                        "Styling " + blockInformation.title.toLowerCase() + " block."
                    )

                )

            );

        }


        // Reset css options
        function sfb_reset_style(rules) {

            // Get selector
            var selector = $(".is-selected [class*='sfb-style-']");

            // Get thisClass
            var thisClass = selector.attr("class").match(/(^|\s)sfb-style-(\d)+(\s|$)/g)[0].replace(/\s+/g, "");

            // loop rules
            for (var i = 0; i < rules.length; i++) {

                // Delete this style
                sfb.data.find("#" + thisClass + "-" + rules[i]).remove();

                // Update color box
                if (rules[i] == "color" || rules[i] == "background-color" || rules[i] == "box-shadow" || rules[i] == "border-color") {

                    // Get rule id
                    var id = rules[i].replace(/\-/g, "_");

                    // Get box shadow color id
                    if (rules[i] == "box-shadow") {
                        id = "box_shadow_color";
                    }

                    // For update the color box
                    var defaultColor = readValue(rules[i], "color", id);

                    // Update color box
                    $(".sfb-" + id + "-color-box span").css("background-color", defaultColor);

                }

            }

            // Update textarea
            $("#sfb-css-editor").val(GetCSSByClass(thisClass));

            // Save CSS
            _data.dispatch('core/editor').editPost({
                meta: {
                    "sfb_css": get_sfb_styles(),
                },
            });

        }


        // Render CSS Editor
        function sfb_css_editor() {

            // Get Current Block
            var block = _data.select('core/block-editor').getSelectedBlock();

            if (block == null) {
                return "";
            }

            // Get thisClass
            var thisClass = sfb_block_auto_class();

            // Return CSS editor
            return el("div", {
                    id: "sfb-css-editor-area",
                    onClick: function(e) {

                        // Focus
                        $("#sfb-css-editor").focus();

                        // Reset
                        if ($(e.target).hasClass("reset-block-btn") || $(e.target).parent().hasClass("reset-block-btn")) {

                            // Remove all styles from this class
                            sfb.data.find("[data-class='" + thisClass + "']").remove();

                            // Save CSS
                            _data.dispatch('core/editor').editPost({
                                meta: {
                                    "sfb_css": get_sfb_styles(),
                                },
                            });

                            // Update textarea
                            $("#sfb-css-editor").val(GetCSSByClass(thisClass));

                        }

                    }
                },

                // Title
                el("span", null, el("span", null, "Custom CSS", el(Dashicon, {
                        icon: "image-rotate",
                        title: "Reset Block Styles",
                        className: "reset-block-btn"
                    })),

                    // Go pro link
                    el("a", {
                        target: "_blank",
                        href: "https://yellowpencil.waspthemes.com/?utm_source=sfb&utm_medium=text&utm_campaign=sfb"
                    }, "Go Pro")

                ),

                // CSS Code start here
                el("div", null, ("." + thisClass), el("span", null, "{")),
                el("textarea", {
                    id: "sfb-css-editor",
                    placeholder: "Type your code here.",
                    onChange: function(e) {

                        // Get rules
                        var css = $("#sfb-css-editor").val();

                        // Add selector to css
                        css = "." + thisClass + "{" + css + "}";

                        // Clean spaces
                        css = css.replace(/\r?\n|\r/g, "").replace(/\t/g, "");

                        // Update sfb data by textarea
                        sfb.data.html(getStyleData(css, thisClass));

                        // Save CSS
                        _data.dispatch('core/editor').editPost({
                            meta: {
                                "sfb_css": get_sfb_styles(),
                            },
                        });

                    }
                }),
                el("div", null, el("span", null, "}"))
            );

        }


        // Render CSS options
        function sfb_editor() {

            // Get Current Block
            var block = _data.select('core/block-editor').getSelectedBlock();

            if (block == null) {
                return "";
            }

            // Panel
            return el(Panel, {
                    header: false
                },


                // Panel: Typography
                el(PanelBody, {
                        title: "Typography",
                        initialOpen: false
                    },

                    // Row: Typography ------
                    el(PanelRow, {},

                        // Reset
                        el("div", {
                            class: "sfb-style-reset-button",
                            onClick: function() {
                                sfb_reset_style(["font-family"]);
                            }
                        }, "Reset"),

                        // Rule: font-family
                        el(sfbSelect, {

                                label: "Font Family",
                                rule: "font-family",
                                id: 'font_family',

                                options: [{
                                    "value": "Arial,'Helvetica Neue',Helvetica,sans-serif",
                                    "label": "Default"
                                }, {
                                    "value": "Arial,'Helvetica Neue',Helvetica,sans-serif",
                                    "label": "Arial"
                                }, {
                                    "value": "'Helvetica Neue',Helvetica,Arial,sans-serif",
                                    "label": "Helvetica Neue"
                                }, {
                                    "value": "'TimesNewRoman','Times New Roman',Times,Baskerville,Georgia,serif",
                                    "label": "Times New Roman"
                                }, {
                                    "value": "'Courier New',Courier,'Lucida Sans Typewriter','Lucida Typewriter',monospace",
                                    "label": "Courier New"
                                }, {
                                    "value": "Verdana,Geneva,sans-serif",
                                    "label": "Verdana"
                                }, {
                                    "value": "Georgia,Times,'Times New Roman',serif",
                                    "label": "Georgia"
                                }, {
                                    "value": "Palatino,'Palatino Linotype','Palatino LT STD','Book Antiqua',Georgia,serif",
                                    "label": "Palatino"
                                }, {
                                    "value": "Garamond,Baskerville,'Baskerville Old Face','Hoefler Text','Times New Roman',serif",
                                    "label": "Garamond"
                                }, {
                                    "value": "'Trebuchet MS','Lucida Grande','Lucida Sans Unicode','Lucida Sans',Tahoma,sans-serif",
                                    "label": "Trebuchet MS"
                                }, {
                                    "value": "'Arial Black','Arial Bold',Gadget,sans-serif",
                                    "label": "Arial Black"
                                }, {
                                    "value": "Impact,Haettenschweiler,'Franklin Gothic Bold',Charcoal,'Helvetica Inserat','Bitstream Vera Sans Bold','Arial Black','sans serif'",
                                    "label": "Impact"
                                }, {
                                    "value": "Tahoma,Verdana,Segoe,sans-serif",
                                    "label": "Tahoma"
                                }],
                            }

                        ),


                        // Reset
                        el("div", {
                            class: "sfb-style-reset-button",
                            onClick: function() {
                                sfb_reset_style(["color", "font-size", "font-weight"]);
                            }
                        }, "Reset"),

                        el("label", {
                                class: "sfb-label",
                            },
                            'Font Options'
                        ),

                        // Group
                        el("div", {
                                class: "sfb-rule-combine sfb-3-combine-custom"
                            },

                            // Rule: color
                            el(sfbColor, {
                                label: "Color",
                                rule: "color",
                                id: 'color'
                            }),

                            // Rule: font-size
                            el(sfbNumber, {
                                    label: "Size",
                                    rule: "font-size",
                                    id: 'font_size',
                                    unit: "px",
                                    min: 0,
                                    max: 100,
                                }

                            ),

                            // Rule: font-weight
                            el(sfbSelect, {

                                    label: "Weight",
                                    rule: "font-weight",
                                    id: 'font_weight',

                                    options: [

                                        {
                                            label: "Light",
                                            value: "300",
                                        },
                                        {
                                            label: "Normal",
                                            value: "400",
                                        },
                                        {
                                            label: "Semi-Bold",
                                            value: "500",
                                        },
                                        {
                                            label: "Bold",
                                            value: "600",
                                        },
                                        {
                                            label: "Extra-Bold",
                                            value: "700",
                                        },

                                    ],
                                }

                            )

                        ),


                        el("div", {
                            class: "sfb-style-reset-button",
                            onClick: function() {
                                sfb_reset_style(["line-height", "letter-spacing", "word-spacing"]);
                            }
                        }, "Reset"),

                        el("label", {
                                class: "sfb-label",
                            },
                            'Spacing'
                        ),

                        el("div", {
                                class: "sfb-rule-combine sfb-3-combine",
                            },

                            // Rule: line-height
                            el(sfbNumber, {
                                    label: "Line",
                                    rule: "line-height",
                                    id: 'line_height',
                                    unit: "px",
                                    min: 0,
                                    max: 100,
                                }

                            ),

                            // Rule: letter-spacing
                            el(sfbNumber, {
                                    label: "Letter",
                                    rule: "letter-spacing",
                                    id: 'letter_spacing',
                                    unit: "px",
                                    min: -5,
                                    max: 10,
                                }

                            ),

                            // Rule: word-spacing
                            el(sfbNumber, {
                                    label: "Word",
                                    rule: "word-spacing",
                                    id: 'word_spacing',
                                    unit: "px",
                                    min: -5,
                                    max: 20,
                                }

                            )

                        ),


                        // Reset
                        el("div", {
                            class: "sfb-style-reset-button",
                            onClick: function() {
                                sfb_reset_style(["font-style", "text-shadow"]);
                            }
                        }, "Reset"),


                        el("label", {
                                class: "sfb-label",
                            },
                            'Font Style & Shadow'
                        ),


                        // Group: font-style & text-shadow
                        el("div", {
                                class: "sfb-rule-combine sfb-2-combine-plus"
                            },

                            // Rule: font-style
                            el(sfbRadio, {

                                    label: "Style",
                                    rule: "font-style",
                                    id: 'font_style',

                                    options: [{
                                            label: 'normal',
                                            value: 'normal'
                                        },
                                        {
                                            label: el("span", {
                                                    style: {
                                                        fontStyle: "italic",
                                                    }
                                                },
                                                'italic'),
                                            value: 'italic'
                                        },
                                    ],

                                }

                            ),

                            // Rule: text-shadow
                            el(sfbSelect, {

                                    label: "Shadow",
                                    rule: "text-shadow",
                                    id: 'text_shadow',

                                    options: [

                                        {
                                            label: "none",
                                            value: "none",
                                        },
                                        {
                                            label: "Basic Shadow",
                                            value: "rgba(0, 0, 0, 0.3) 0px 1px 1px",
                                        },
                                        {
                                            label: "Multiple Shadow",
                                            value: "rgb(255, 255, 255) 1px 1px 0px, rgb(170, 170, 170) 2px 2px 0px",
                                        },
                                        {
                                            label: "Anaglyh",
                                            value: "rgb(255, 0, 0) -1px 0px 0px, rgb(0, 255, 255) 1px 0px 0px",
                                        },
                                        {
                                            label: "Emboss",
                                            value: "rgb(255, 255, 255) 0px 1px 1px, rgb(0, 0, 0) 0px -1px 1px",
                                        },
                                        {
                                            label: "Neon",
                                            value: "rgb(255, 255, 255) 0px 0px 2px, rgb(255, 255, 255) 0px 0px 4px, rgb(255, 255, 255) 0px 0px 6px, rgb(255, 119, 255) 0px 0px 8px, rgb(255, 0, 255) 0px 0px 12px, rgb(255, 0, 255) 0px 0px 16px, rgb(255, 0, 255) 0px 0px 20px, rgb(255, 0, 255) 0px 0px 24px",
                                        },
                                        {
                                            label: "Outline",
                                            value: "rgb(0, 0, 0) 0px 1px 1px, rgb(0, 0, 0) 0px -1px 1px, rgb(0, 0, 0) 1px 0px 1px, rgb(0, 0, 0) -1px 0px 1px",
                                        },

                                    ],
                                }

                            )

                        ),


                        // Reset
                        el("div", {
                            class: "sfb-style-reset-button",
                            onClick: function() {
                                sfb_reset_style(["text-align"]);
                            }
                        }, "Reset"),

                        // Rule: text-align
                        el(sfbRadio, {

                                label: "Text Align",
                                rule: "text-align",
                                id: 'text_align',

                                options: [{
                                        label: 'left',
                                        value: 'left'
                                    },
                                    {
                                        label: 'center',
                                        value: 'center'
                                    },
                                    {
                                        label: 'right',
                                        value: 'right'
                                    },
                                    {
                                        label: 'justify',
                                        value: 'justify'
                                    },
                                ],

                            }

                        ),


                        // Reset
                        el("div", {
                            class: "sfb-style-reset-button",
                            onClick: function() {
                                sfb_reset_style(["text-transform"]);
                            }
                        }, "Reset"),

                        // Rule: text-align
                        el(sfbRadio, {

                                label: "Text Transform",
                                rule: "text-transform",
                                id: 'text_transform',

                                options: [{
                                        label: 'normal',
                                        value: 'none'
                                    },
                                    {
                                        label: el("span", {
                                            style: {
                                                fontWeight: "600"
                                            }
                                        }, 'Aa'),
                                        value: 'capitalize'
                                    },
                                    {
                                        label: el("span", {
                                            style: {
                                                fontWeight: "600"
                                            }
                                        }, 'AA'),
                                        value: 'uppercase'
                                    },
                                    {
                                        label: el("span", {
                                            style: {
                                                fontWeight: "600"
                                            }
                                        }, 'aa'),
                                        value: 'lowercase'
                                    },
                                ],

                            }

                        ),

                        // Reset
                        el("div", {
                            class: "sfb-style-reset-button",
                            onClick: function() {
                                sfb_reset_style(["text-decoration"]);
                            }
                        }, "Reset"),

                        // Rule: text-decoration
                        el(sfbRadio, {

                                class: "sfb-text-decoration-group",
                                label: "Text Decoration",
                                rule: "text-decoration",
                                id: 'text_decoration',

                                options: [{
                                        label: el("span", {
                                            style: {
                                                textDecoration: "none"
                                            }
                                        }, 'Aa'),
                                        value: 'none',
                                    },
                                    {
                                        label: el("span", {
                                            style: {
                                                fontWeight: "600",
                                                textDecoration: "overline"
                                            }
                                        }, 'Aa'),
                                        value: 'overline',
                                    },
                                    {
                                        label: el("span", {
                                            style: {
                                                fontWeight: "600",
                                                textDecoration: "line-through"
                                            }
                                        }, 'Aa'),
                                        value: 'line-through',
                                    },
                                    {
                                        label: el("span", {
                                            style: {
                                                fontWeight: "600",
                                                textDecoration: "underline"
                                            }
                                        }, 'Aa'),
                                        value: 'underline',
                                    },
                                ],

                            }

                        )

                    )

                ),


                // Panel: Appearance
                el(PanelBody, {
                        title: "Appearance",
                        initialOpen: false
                    },

                    // Row: Appearance ------
                    el(PanelRow, {},

                        // Reset
                        el("div", {
                            class: "sfb-style-reset-button",
                            onClick: function() {
                                sfb_reset_style(["opacity"]);
                            }
                        }, "Reset"),

                        // Rule: opacity
                        el(sfbSlider, {
                                label: "Opacity",
                                rule: "opacity",
                                id: 'opacity',
                                unit: "",
                                min: 0,
                                max: 100,
                            }

                        ),


                        // background-color
                        el("div", {
                                class: "sfb-background-color"
                            },

                            // Reset
                            el("div", {
                                class: "sfb-style-reset-button",
                                onClick: function() {
                                    sfb_reset_style(["background-color"]);
                                }
                            }, "Reset"),

                            // Rule: background-color
                            el(sfbColor, {
                                label: "Fill",
                                rule: "background-color",
                                id: 'background_color',
                            })

                        ),


                        // Reset
                        el("div", {
                            class: "sfb-style-reset-button",
                            onClick: function() {
                                sfb_reset_style(["border-color", "border-width", "border-style"]);
                            }
                        }, "Reset"),

                        // Border group label
                        el("label", {
                                class: "sfb-label",
                            },
                            'Border'
                        ),

                        // Border Group
                        el("div", {
                                class: "sfb-rule-combine sfb-3-combine-custom"
                            },

                            // Rule: border-color
                            el(sfbColor, {
                                label: "Color",
                                rule: "border-color",
                                id: 'border_color'
                            }),

                            // Rule: border-width
                            el(sfbNumber, {
                                    label: "Thickness",
                                    rule: "border-width",
                                    id: 'border_width',
                                    unit: "px",
                                    min: 0,
                                    max: 50,
                                }

                            ),


                            // Rule: border-style
                            el(sfbSelect, {

                                    label: "Style",
                                    rule: "border-style",
                                    id: 'border_style',

                                    options: [

                                        {
                                            label: "solid",
                                            value: "solid",
                                        },
                                        {
                                            label: "dashed",
                                            value: "dashed",
                                        },
                                        {
                                            label: "dotted",
                                            value: "dotted",
                                        },
                                        {
                                            label: "double",
                                            value: "double",
                                        },

                                    ],
                                }

                            )

                        ),


                        el("div", {
                            class: "sfb-style-reset-button",
                            onClick: function() {
                                sfb_reset_style(["border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius"]);
                            }
                        }, "Reset"),

                        el("label", {
                                class: "sfb-label",
                            },
                            'Border Radius'
                        ),

                        el("div", {
                                class: "sfb-rule-combine sfb-4-combine"
                            },

                            // Rule: border-top-left-radius
                            el(sfbNumber, {
                                    label: "T. Left",
                                    rule: "border-top-left-radius",
                                    id: 'border_top_left_radius',
                                    unit: "px",
                                    min: 0,
                                    max: 50,
                                }

                            ),


                            // Rule: border-top-right-radius
                            el(sfbNumber, {
                                    label: "T. Right",
                                    rule: "border-top-right-radius",
                                    id: 'border_top_right_radius',
                                    unit: "px",
                                    min: 0,
                                    max: 50,
                                }

                            ),


                            // Rule: border-bottom-left-radius
                            el(sfbNumber, {
                                    label: "B. Left",
                                    rule: "border-bottom-left-radius",
                                    id: 'border_bottom_left_radius',
                                    unit: "px",
                                    min: 0,
                                    max: 50,
                                }

                            ),


                            // Rule: border-bottom-right-radius
                            el(sfbNumber, {
                                    label: "B. Right",
                                    rule: "border-bottom-right-radius",
                                    id: 'border_bottom_right_radius',
                                    unit: "px",
                                    min: 0,
                                    max: 50,
                                }

                            )

                        ),



                        el("div", {
                            class: "sfb-style-reset-button",
                            onClick: function() {
                                sfb_reset_style(["box-shadow"]);
                            }
                        }, "Reset"),

                        el("label", {
                                class: "sfb-label",
                            },
                            'Box Shadow'
                        ),

                        el("div", {
                                class: "sfb-rule-combine sfb-5-combine sfb-box-shadow-group"
                            },

                            // Rule: box-shadow-color
                            el(sfbColor, {
                                label: "Color",
                                rule: "box-shadow",
                                id: 'box_shadow_color'
                            }),

                            // Rule: box-shadow-x
                            el(sfbNumber, {
                                    label: "X",
                                    rule: "box-shadow",
                                    id: 'box_shadow_x',
                                    unit: "px",
                                    min: 0,
                                    max: 50,
                                }

                            ),

                            // Rule: box-shadow-y
                            el(sfbNumber, {
                                    label: "Y",
                                    rule: "box-shadow",
                                    id: 'box_shadow_y',
                                    unit: "px",
                                    min: 0,
                                    max: 50,
                                }

                            ),


                            // Rule: box-shadow-blur
                            el(sfbNumber, {
                                    label: "Blur",
                                    rule: "box-shadow",
                                    id: 'box_shadow_blur',
                                    unit: "px",
                                    min: 0,
                                    max: 50,
                                }

                            ),


                            // Rule: box-shadow-spread
                            el(sfbNumber, {
                                    label: "Spread",
                                    rule: "box-shadow",
                                    id: 'box_shadow_spread',
                                    unit: "px",
                                    min: 0,
                                    max: 50,
                                }

                            )

                        )

                    )

                ),


                // Panel: Dimensions
                el(PanelBody, {
                        title: "Dimensions",
                        initialOpen: false
                    },

                    // Row: Dimensions ------
                    el(PanelRow, {},

                        el("div", {
                            class: "sfb-style-reset-button",
                            onClick: function() {
                                sfb_reset_style(["margin-left", "margin-right", "margin-top", "margin-bottom"]);
                            }
                        }, "Reset"),

                        el("label", {
                                class: "sfb-label",
                            },
                            'Margin'
                        ),

                        el("div", {
                                class: "sfb-rule-combine sfb-4-combine"
                            },

                            // Rule: margin-left
                            el(sfbNumber, {
                                    label: "Left",
                                    rule: "margin-left",
                                    id: 'margin_left',
                                    unit: "px",
                                    min: -50,
                                    max: 200,
                                }

                            ),

                            // Rule: margin-right
                            el(sfbNumber, {
                                    label: "Right",
                                    rule: "margin-right",
                                    id: 'margin_right',
                                    unit: "px",
                                    min: -50,
                                    max: 200,
                                }

                            ),

                            // Rule: margin-top
                            el(sfbNumber, {
                                    label: "Top",
                                    rule: "margin-top",
                                    id: 'margin_top',
                                    unit: "px",
                                    min: -50,
                                    max: 200,
                                }

                            ),

                            // Rule: margin-bottom
                            el(sfbNumber, {
                                    label: "Bottom",
                                    rule: "margin-bottom",
                                    id: 'margin_bottom',
                                    unit: "px",
                                    min: -50,
                                    max: 200,
                                }

                            )

                        ),



                        el("div", {
                            class: "sfb-style-reset-button",
                            onClick: function() {
                                sfb_reset_style(["padding-left", "padding-right", "padding-bottom", "padding-top"]);
                            }
                        }, "Reset"),

                        el("label", {
                                class: "sfb-label",
                            },
                            'Padding'
                        ),

                        el("div", {
                                class: "sfb-rule-combine sfb-4-combine"
                            },

                            // Rule: padding-left
                            el(sfbNumber, {
                                    label: "Left",
                                    rule: "padding-left",
                                    id: 'padding_left',
                                    unit: "px",
                                    min: 0,
                                    max: 200,
                                }

                            ),

                            // Rule: padding-right
                            el(sfbNumber, {
                                    label: "Right",
                                    rule: "padding-right",
                                    id: 'padding_right',
                                    unit: "px",
                                    min: 0,
                                    max: 200,
                                }

                            ),

                            // Rule: padding-top
                            el(sfbNumber, {
                                    label: "Top",
                                    rule: "padding-top",
                                    id: 'padding_top',
                                    unit: "px",
                                    min: 0,
                                    max: 200,
                                }

                            ),

                            // Rule: padding-bottom
                            el(sfbNumber, {
                                    label: "Bottom",
                                    rule: "padding-bottom",
                                    id: 'padding_bottom',
                                    unit: "px",
                                    min: 0,
                                    max: 200,
                                }

                            )

                        ),


                        el("div", {
                            class: "sfb-style-reset-button",
                            onClick: function() {
                                sfb_reset_style(["width", "height"]);
                            }
                        }, "Reset"),

                        el("label", {
                                class: "sfb-label",
                            },
                            'Size'
                        ),

                        el("div", {
                                class: "sfb-rule-combine sfb-2-combine"
                            },

                            // Rule: width
                            el(sfbNumber, {
                                    label: "Width",
                                    rule: "width",
                                    id: 'width',
                                    unit: "px",
                                    min: 0,
                                    max: 100,
                                }

                            ),


                            // Rule: min-height
                            el(sfbNumber, {
                                    label: "Min Height",
                                    rule: "min-height",
                                    id: 'min_height',
                                    unit: "px",
                                    min: 0,
                                    max: 1000,
                                }

                            )

                        )

                    )

                )

            );

        }



        // Clean unused sfb-style-xxx classes
        function sfb_class_cleaner() {

            // Get all block
            var allBlock = _data.select('core/block-editor').getBlocks();
            var classNames, thisClass, newClassName;

            // look block
            allBlock.forEach(function(block) {

                // Get class name
                classNames = block.attributes.className;

                // make as empty variable if not defined
                if (classNames == undefined || classNames == null) {
                    classNames = "";
                }

                // Search for an other same class
                if (classNames.indexOf("sfb-style-") != -1) {

                    // Get this class
                    thisClass = classNames.match(/(^|\s)sfb-style-(\d)+(\s|$)/g)[0].replace(/\s+/g, "");

                    // Delete it if not have any style like that in sfb dataa
                    if (sfb.data.find("[data-class='" + thisClass + "']").length == 0) {

                        // clean up this class
                        classNames = classNames.replace(/sfb-style-(\d+)/g, "");

                        // Clean spaces
                        newClassName = $.trim(classNames.replace(/\s+/g, " "));

                        // Make it null for not show class as empty.
                        if (newClassName == "") {
                            newClassName = undefined;
                        }

                        // update block
                        _data.dispatch('core/editor').updateBlock(block.clientId, {
                            attributes: {
                                className: newClassName,
                            }
                        });

                    }

                }

            });

        }


        // Create auto class and add current block
        function sfb_block_auto_class() {

            // Variables
            var block, blockId, classNames, thisClass, newClassName, random = GetmatchlessNumber();

            // Get Block
            block = _data.select('core/block-editor').getSelectedBlock();

            // Null
            if (!block) {
                return false;
            }

            // Get ID
            blockId = block.clientId;

            // Get ClassName
            classNames = block.attributes.className;

            // Empty
            if (classNames == undefined || classNames == null) {
                classNames = "";
            }

            // Generate New Class
            thisClass = "sfb-style-" + random;

            // If not has
            if (classNames.indexOf("sfb-style-") == -1) {

                // Clean spaces
                newClassName = $.trim((classNames + " " + thisClass).replace(/\s+/g, " "));

                // Make it null for not show class as empty.
                if (newClassName == "") {
                    newClassName = undefined;
                }

                // Add
                _data.dispatch('core/editor').updateBlock(blockId, {
                    attributes: {
                        className: newClassName,
                    }
                });

                // Get available class if has 
            } else {

                thisClass = classNames.match(/(^|\s)sfb-style-(\d)+(\s|$)/g)[0].replace(/\s+/g, "");

            }

            return thisClass;

        }


        // Dedect when selected block change.
        var lastBlockId = null,
            blockId = null,
            panels = {
                0: false,
                1: false,
                2: false
            };
        setInterval(function() {

            // Get Block
            var block = _data.select('core/block-editor').getSelectedBlock();

            // Empty is null, or ID
            if (block == null) {
                blockId = null;
            } else {
                blockId = block.clientId;
            }

            // Update if not same
            if (blockId != lastBlockId) {

                // If SFB is Open
                if ($(".sfb-sidebar-content").length > 0) {

                    var SidebarBtn = $(".components-icon-button[aria-label='Style4Block']");

                    // Checks open panels
                    $(".sfb-sidebar-content > .components-panel > .components-panel__body").each(function(i, el) {
                        panels[i] = $(this).hasClass("is-opened");
                    });

                    // To Render Sidebar UI.
                    SidebarBtn.trigger("click").trigger("click");

                    // Re-open opened tabs
                    $.each(panels, function(index, status) {

                        // 0 > 1
                        index++;

                        // If was open
                        if (status) {
                            $(".sfb-sidebar-content .components-panel .components-panel__body:nth-child(" + index + ") .components-panel__body-title > .components-panel__body-toggle").trigger("click");
                        }

                    });

                }

            }

            // Update last
            lastBlockId = blockId;

        }, 400);

        // Full height sidebar
        function getPanelHeight() {
            return ($(".edit-post-layout__content").height() - 50 - 1) + "px"; // 50px sidebar header, 1px bottom border
        }

        // Register Plugin
        registerPlugin('sfb-plugin', {

            // Render
            render: function() {

                // Cleans
                sfb_class_cleaner();

                // Add active class to selected block
                sfb_block_auto_class();

                // Update CSS Editor
                setTimeout(function() {
                    $("#sfb-css-editor").val(GetCSSByClass());
                }, 20);

                return el(wp.element.Fragment, null, el(wp.editPost.PluginSidebarMoreMenuItem, {
                        target: "sfb-plugin",
                        icon: "admin-appearance"
                    }, "Style4Block"), el(PluginSidebar, {
                            name: 'sfb-plugin',
                            icon: 'admin-appearance',
                            title: 'Style4Block',
                        },

                        // Sidebar
                        el('div', {
                                className: 'sfb-sidebar-content',
                                style: {
                                    height: getPanelHeight()
                                },
                            },

                            // Card Selection
                            el(sfb_selection_card),

                            // Editor options
                            el(sfb_editor),

                            // CSS Editor
                            el(sfb_css_editor)

                        )

                    )

                );

            }

        });

    });
})(window.wp);
})(jQuery);
