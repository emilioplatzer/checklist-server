"use strict";

(function(moduleTarget,moduleName){

var estructura={};

estructura.variables={
    orden   :{ tipo:'numerico' ,ancho: 4, esId: true},
    fecha   :{ tipo:'fecha'    ,ancho: 5},
    inicio  :{ tipo:'hora'     ,ancho: 7},
    equipo  :{ tipo:'texto'    ,ancho:12},
    tecnico :{ tipo:'texto'    ,ancho:12},
    baterias:{ tipo:'numerico' ,ancho: 2},
    iniciob :{ tipo:'hora'     ,ancho: 7, leyenda: 'inicio del reboot' },
    finb    :{ tipo:'hora'     ,ancho: 7, leyenda: 'final del reboot'  },
    lugarver:{ tipo:'numerico' ,ancho: 2, leyenda: 'ubicación de lista'},
    lugarcie:{ tipo:'numerico' ,ancho: 2, leyenda: 'número para ciego' },
    cantobs :{ tipo:'numerico' ,ancho: 2}, 
    itemsobs:{ tipo:'texto'    ,ancho:12}
}

estructura.maxitems=70;

moduleTarget[moduleName]=estructura;
    
}).apply(null,typeof window==="undefined"?[modules, 'export']:[window, 'estructura']);
    