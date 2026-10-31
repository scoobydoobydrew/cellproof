// Overlay for PhysiBoSS: the four functions its main program expects, for a tissue of cells that each carry the project's
// Boolean network (config/model.bnd). Built by scripts/physiboss_setup.sh on top of an unmodified PhysiBoSS checkout.
#ifndef __CELLPROOF_CUSTOM_H__
#define __CELLPROOF_CUSTOM_H__

#include "../core/PhysiCell.h"
#include "../modules/PhysiCell_standard_modules.h"

using namespace BioFVM;
using namespace PhysiCell;

void create_cell_types( void );
void setup_tissue( void );
void setup_microenvironment( void );
std::vector<std::string> my_coloring_function( Cell* );

#endif
