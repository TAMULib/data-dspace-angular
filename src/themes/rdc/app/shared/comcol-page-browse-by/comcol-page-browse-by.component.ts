import { AsyncPipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatestWith, filter, map, Observable, of, switchMap } from 'rxjs';

import { getCollectionPageRoute } from '../../../../../app/collection-page/collection-page-routing-paths';
import { getCommunityPageRoute } from '../../../../../app/community-page/community-page-routing-paths';
import { BrowseService } from '../../../../../app/core/browse/browse.service';
import { CollectionDataService } from '../../../../../app/core/data/collection-data.service';
import { CommunityDataService } from '../../../../../app/core/data/community-data.service';
import { PaginatedList } from '../../../../../app/core/data/paginated-list.model';
import { BrowseDefinition } from '../../../../../app/core/shared/browse-definition.model';
import { Collection } from '../../../../../app/core/shared/collection.model';
import { getFirstCompletedRemoteData } from '../../../../../app/core/shared/operators';
import { ComcolPageBrowseByComponent as BaseComponent, ComColPageNavOption } from '../../../../../app/shared/comcol/comcol-page-browse-by/comcol-page-browse-by.component';
import { followLink } from '../../../../../app/shared/utils/follow-link-config.model';

import { APP_CONFIG, AppConfig } from '../../../../../config/app-config.interface';
import { RemoteData } from '../../../../../app/core/data/remote-data';

const dateissued = 'dateissued';
const author = 'author';
const title = 'title';
const subject = 'subject';
const department = 'department';
const fundingAgency = 'fundingAgency';
const awardNumber = 'awardNumber';
const type = 'type';
const name = 'name';

/**
 * A component to display the "Browse By" section of a Community or Collection page
 * It expects the ID of the Community or Collection as input to be passed on as a scope
 */
@Component({
  selector: 'ds-comcol-page-browse-by',
  // styleUrls: ['./comcol-page-browse-by.component.scss'],
  styleUrls: ['../../../../../app/shared/comcol/comcol-page-browse-by/comcol-page-browse-by.component.scss'],
  // templateUrl: './comcol-page-browse-by.component.html'
  templateUrl: '../../../../../app/shared/comcol/comcol-page-browse-by/comcol-page-browse-by.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    RouterLink,
    TranslateModule,
  ],
})
export class ComcolPageBrowseByComponent extends BaseComponent {

  readonly browseByMap = {
    'All': [dateissued, author, title, subject, department, fundingAgency, awardNumber, type],
    'Dataset': [dateissued, author, title, subject],
    'PDAC': [dateissued, department, name],
    'ResearchProject': [dateissued, author, title, subject, department, fundingAgency, awardNumber],
  };

  constructor(
    @Inject(APP_CONFIG) readonly _appConfig: AppConfig,
    readonly _route: ActivatedRoute,
    readonly _router: Router,
    readonly _browseService: BrowseService,
    readonly _communityService: CommunityDataService,
    readonly _collectionService: CollectionDataService,
  ) {
    super(_appConfig, _router, _browseService);
  }

  ngOnInit(): void {
    let dsoObs: Observable<Collection[]>;
    switch (this.contentType) {
      case 'community':
        dsoObs = this._communityService.findById(this.id, true, false, followLink('collections'))
          .pipe(
            map((dso) => dso?.payload),
            filter((dso) => (dso as any)?.collections),
            switchMap((dso) => (dso as any).collections
              .pipe(map((collections: any) => collections?.payload?.page || [])))) as Observable<Collection[]>;
        break;
      case 'collection':
        dsoObs = this._collectionService.findById(this.id, true, false)
          .pipe(map((dso) => [dso?.payload]));
        break;
      default:
        dsoObs = of();
    }

    // Determine if browse by options is working correctly without integrating the customization.
    // If collection view is still containing unrelated browse by for the entity type,
    // please integrate customiztion by filtering out the browse by links according to the above
    // browseByMap.

    this.allOptions$ = this._browseService.getBrowseDefinitions().pipe(
      getFirstCompletedRemoteData(),
      map((browseDefListRD: RemoteData<PaginatedList<BrowseDefinition>>) => {
        const allOptions: ComColPageNavOption[] = [];
        if (browseDefListRD.hasSucceeded) {
          let comColRoute: string;
          if (this.contentType === 'collection') {
            comColRoute = getCollectionPageRoute(this.id);
            allOptions.push({
              id: 'search',
              label: 'collection.page.browse.search.head',
              routerLink: `${comColRoute}/search`,
            });
          } else if (this.contentType === 'community') {
            comColRoute = getCommunityPageRoute(this.id);
            allOptions.push({
              id: 'search',
              label: 'collection.page.browse.search.head',
              routerLink: `${comColRoute}/search`,
            });
            allOptions.push({
              id: 'comcols',
              label: 'community.all-lists.head',
              routerLink: `${comColRoute}/subcoms-cols`,
            });
          }

          allOptions.push(...browseDefListRD.payload.page.map((config: BrowseDefinition) => ({
            id: `browse_${config.id}`,
            label: `browse.comcol.by.${config.id}`,
            routerLink: `${comColRoute}/browse/${config.id}`,
          })));

          // When the default tab is not the "search" tab, the "search" tab is moved
          // at the end of the tabs ribbon for aesthetics purposes.
          if (this.appConfig[this.contentType].defaultBrowseTab !== 'search') {
            allOptions.push(allOptions.shift());
          }
        }
        return allOptions;
      }),
    );
  }

  getBrowseByOptionsForCollections(collections: Collection[] = []): any[] {
    const uniqueBrowseByOptions = new Set();

    collections.forEach(collection => {
      const entityType = collection?.metadata?.['dspace.entity.type']?.[0]?.value;

      if (entityType && this.browseByMap[entityType]) {
        this.browseByMap[entityType].forEach(option => {
          uniqueBrowseByOptions.add(option);
        });
      } else {
        this.browseByMap['All'].forEach(option => {
          uniqueBrowseByOptions.add(option);
        });
      }
    });

    return Array.from(uniqueBrowseByOptions);
  }

}
