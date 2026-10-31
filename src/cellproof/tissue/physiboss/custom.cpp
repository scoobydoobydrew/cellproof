// Overlay for PhysiBoSS, see custom.h. The calls follow the template project of PhysiCell (BSD 3-Clause, Macklin et al.; see
// THIRD_PARTY.md); the behaviour of the cells comes from the settings file and the Boolean network, not from code here.
#include "custom.h"

void create_cell_types( void )
{
	if( parameters.ints.find_index( "random_seed" ) != -1 )
	{
		SeedRandom( parameters.ints( "random_seed" ) );
	}

	initialize_default_cell_definition();
	cell_defaults.phenotype.secretion.sync_to_microenvironment( &microenvironment );
	cell_defaults.functions.volume_update_function = standard_volume_update_function;
	cell_defaults.functions.update_velocity = standard_update_cell_velocity;
	cell_defaults.functions.update_phenotype = NULL;
	cell_defaults.functions.update_migration_bias = NULL;
	cell_defaults.functions.custom_cell_rule = NULL;

	initialize_cell_definitions_from_pugixml();
	build_cell_definitions_maps();
	setup_signal_behavior_dictionaries();
	display_cell_definitions( std::cout );
}

void setup_microenvironment( void )
{
	initialize_microenvironment();
}

void setup_tissue( void )
{
	load_cells_from_pugixml();
}

std::vector<std::string> my_coloring_function( Cell* pCell )
{
	return paint_by_number_cell_coloring( pCell );
}
