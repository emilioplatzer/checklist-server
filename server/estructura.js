"use strict";

(function(moduleTarget,moduleName){

var estructura={};

estructura.variables={
    orden   :{ tipo:'numerico' , esId: true},
    fecha   :{ tipo:'fecha'    },
    inicio  :{ tipo:'hora'     },
    equipo  :{ tipo:'texto'    },
    tecnico :{ tipo:'texto'    },
    baterias:{ tipo:'numerico' },
    iniciob :{ tipo:'hora'     , leyenda: 'inicio del reboot' },
    finb    :{ tipo:'hora'     , leyenda: 'final del reboot'  },
    lugarver:{ tipo:'numerico' , leyenda: 'ubicación de lista'},
    lugarcie:{ tipo:'numerico' , leyenda: 'número para ciego' },
    cantobs :{ tipo:'numerico' }, 
    itemsobs:{ tipo:'texto'    }
}

estructura.maxitems=70;

moduleTarget[moduleName]=estructura;
    
}).apply(null,typeof window==="undefined"?[modules, 'export']:[window, 'estructura']);
    