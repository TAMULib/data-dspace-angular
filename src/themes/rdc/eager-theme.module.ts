import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DSONameService } from '../../app/core/breadcrumbs/dso-name.service';
import { RootModule } from '../../app/root.module';
import { RdcDSONameService } from './app/core/breadcrumbs/rdc-dso-name.service';
import { RdcItemPageAbstractFieldComponent } from './app/item-page/simple/field-components/specific-field/abstract/rdc-item-page-abstract-field.component';
import { UntypedItemComponent } from './app/item-page/simple/item-types/untyped-item/untyped-item.component';
import { ComcolPageBrowseByComponent } from './app/shared/comcol-page-browse-by/comcol-page-browse-by.component';

/**
 * Add components that use a custom decorator to ENTRY_COMPONENTS as well as DECLARATIONS.
 * This will ensure that decorator gets picked up when the app loads
 */
const ENTRY_COMPONENTS = [
  ComcolPageBrowseByComponent,
  RdcItemPageAbstractFieldComponent,
  UntypedItemComponent
];

const DECLARATIONS = [
  ...ENTRY_COMPONENTS
];

@NgModule({
  imports: [
    CommonModule,
    // move modules to imports where used in standalone components
    //SharedModule,
    RootModule,
    //NavbarModule,
    //SharedBrowseByModule,
    //ResultsBackButtonModule,
    //ItemPageModule,
    //ItemSharedModule,
    //DsoPageModule,
  ],
  declarations: DECLARATIONS,
  providers: [
    ...ENTRY_COMPONENTS.map((component) => ({ provide: component })),
    { provide: DSONameService, useClass: RdcDSONameService }
  ],
})
/**
 * This module is included in the main bundle that gets downloaded at first page load. So it should
 * contain only the themed components that have to be available immediately for the first page load,
 * and the minimal set of imports required to make them work. Anything you can cut from it will make
 * the initial page load faster, but may cause the page to flicker as components that were already
 * rendered server side need to be lazy-loaded again client side
 *
 * Themed EntryComponents should also be added here
 */
export class EagerThemeModule {
}
