import {
  AsyncPipe,
  NgComponentOutlet,
} from '@angular/common';
import {
  Component,
  Injector,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// TAMU Customization - aria role menubar only when menuitem are present
import { Observable } from 'rxjs';

import { AuthorizationDataService } from '../../../core/data/feature-authorization/authorization-data.service';
// import { AuthorizationDataService } from 'src/app/core/data/feature-authorization/authorization-data.service';
// END TAMU Customization - aria role menubar only when menuitem are present

import { MenuComponent } from '../../menu/menu.component';
import { MenuService } from '../../menu/menu.service';
import { MenuID } from '../../menu/menu-id.model';
import { ThemeService } from '../../theme-support/theme.service';

/**
 * Component representing the edit menu and other menus on the dspace object pages
 */
@Component({
  selector: 'ds-dso-edit-menu',
  styleUrls: ['./dso-edit-menu.component.scss'],
  templateUrl: './dso-edit-menu.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    NgComponentOutlet,
  ],
})
export class DsoEditMenuComponent extends MenuComponent {
  /**
   * The menu ID of this component is DSO_EDIT
   * @type {MenuID.DSO_EDIT}
   */
  menuID = MenuID.DSO_EDIT;

  // TAMU Customization - aria role menubar only when menuitem are present
  /**
   * Whether the DSO_EDIT menu has sub sections.
   * 
   * This is used to determine if the menu items will be
   * rendered within the role="menubar".
   * 
   * @type {Observable<boolean>}
   */
  hasSubSections: Observable<boolean>;
  // END TAMU Customization - aria role menubar only when menuitem are present

  constructor(protected menuService: MenuService,
              protected injector: Injector,
              public authorizationService: AuthorizationDataService,
              public route: ActivatedRoute,
              protected themeService: ThemeService,
  ) {
    super(menuService, injector, authorizationService, route, themeService);
  }

  // TAMU Customization - aria role menubar only when menuitem are present
  ngOnInit(): void {
    super.ngOnInit();
    this.hasSubSections = this.menuService.hasSubSections(this.menuID, null);
  }
  // END TAMU Customization - aria role menubar only when menuitem are present

}
