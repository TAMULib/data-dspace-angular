import { AsyncPipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, EventType, NavigationEnd, Router, RouterLink, Scroll } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { combineLatest, combineLatestWith, distinctUntilChanged, filter, map, Observable, of, startWith, switchMap, take } from 'rxjs';
import { getCollectionPageRoute } from 'src/app/collection-page/collection-page-routing-paths';
import { getCommunityPageRoute } from 'src/app/community-page/community-page-routing-paths';
import { BrowseService } from 'src/app/core/browse/browse.service';
import { CollectionDataService } from 'src/app/core/data/collection-data.service';
import { CommunityDataService } from 'src/app/core/data/community-data.service';
import { BrowseDefinition } from 'src/app/core/shared/browse-definition.model';
import { Collection } from 'src/app/core/shared/collection.model';
import { getFirstCompletedRemoteData } from 'src/app/core/shared/operators';
import { isNotEmpty } from 'src/app/shared/empty.util';
import { followLink } from 'src/app/shared/utils/follow-link-config.model';
import { APP_CONFIG, AppConfig } from 'src/config/app-config.interface';
import { ComcolPageBrowseByComponent as BaseComponent, ComColPageNavOption } from '../../../../../../app/shared/comcol/comcol-page-browse-by/comcol-page-browse-by.component';

// TAMU Customization
const dateissued = 'dateissued';
const author = 'author';
const title = 'title';
const subject = 'subject';
const department = 'department';
const fundingAgency = 'fundingAgency';
const awardNumber = 'awardNumber';
const type = 'type';
const name = 'name';
// END TAMU Customization

/**
 * A component to display the "Browse By" section of a Community or Collection page
 * It expects the ID of the Community or Collection as input to be passed on as a scope
 */
@Component({
  selector: 'ds-themed-comcol-page-browse-by',
  // styleUrls: ['./comcol-page-browse-by.component.scss'],
  styleUrls: ['../../../../../../app/shared/comcol/comcol-page-browse-by/comcol-page-browse-by.component.scss'],
  // templateUrl: './comcol-page-browse-by.component.html'
  templateUrl: '../../../../../../app/shared/comcol/comcol-page-browse-by/comcol-page-browse-by.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    RouterLink,
    TranslateModule,
  ],
})
export class ComcolPageBrowseByComponent extends BaseComponent {

  // TAMU Customization
  readonly browseByMap = {
    'All': [dateissued, author, title, subject, department, fundingAgency, awardNumber, type],
    'Dataset': [dateissued, author, title, subject],
    'PDAC': [dateissued, department, name],
    'ResearchProject': [dateissued, author, title, subject, department, fundingAgency, awardNumber],
  };
  // END TAMU Customization

  // TAMU Customization
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
  // END TAMU Customization

  // TAMU Customization
  ngOnInit(): void {

    // get collections for given scope
    let dsoObs: Observable<Collection[]>;
    switch (this.contentType) {
      case 'community':
        dsoObs = this._communityService.findById(this.id, true, false, followLink('collections'))
          .pipe(
            map((dso) => dso?.payload),
            filter((dso) => (dso as any)?.collections),
            switchMap((dso) => (dso as any).collections
              .pipe(map((collections: any) => collections?.payload?.page ?? [])))) as Observable<Collection[]>;
        break;
      case 'collection':
        dsoObs = this._collectionService.findById(this.id, true, false)
          .pipe(map((dso) => [dso?.payload]));
        break;
      default:
        dsoObs = of();
    }

    this.allOptions$ = this._browseService.getBrowseDefinitions().pipe(
      getFirstCompletedRemoteData(),
      combineLatestWith(dsoObs),
      map(([browseDefListRD, collections]) => {
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

          // get browse by options for all collections
          const browseByOptions = this.getBrowseByOptionsForCollections(collections);

          // reduce the browse by options only pertaining to the applicable collections
          allOptions.push(...browseDefListRD.payload.page.filter(config => browseByOptions.indexOf(config.id) >= 0).map((config: BrowseDefinition) => ({
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

    let comColRoute: string;
    if (this.contentType === 'collection') {
      comColRoute = getCollectionPageRoute(this.id);
    } else if (this.contentType === 'community') {
      comColRoute = getCommunityPageRoute(this.id);
    }

    this.subs.push(combineLatest([
      this.allOptions$,
      this.router.events.pipe(
        startWith(this.router),
        filter((next: Router|Scroll) => (isNotEmpty((next as Router)?.url) || (next as Scroll)?.type === EventType.Scroll)),
        map((next: Router|Scroll) => (next as Router)?.url || ((next as Scroll).routerEvent as NavigationEnd).urlAfterRedirects),
        distinctUntilChanged(),
      ),
    ]).subscribe(([navOptions, url]: [ComColPageNavOption[], string]) => {
      for (const option of navOptions) {
        if (url?.split('?')[0] === comColRoute && option.id === this.appConfig[this.contentType].defaultBrowseTab) {
          void this.router.navigate([option.routerLink], { queryParams: option.params });
          break;
        } else if (option.routerLink === url?.split('?')[0]) {
          this.currentOption$.next(option);
          break;
        }
      }
    }));

    if (this.router.url?.split('?')[0] === comColRoute) {
      this.allOptions$.pipe(
        take(1),
      ).subscribe((allOptions: ComColPageNavOption[]) => {
        for (const option of allOptions) {
          if (option.id === this.appConfig[this.contentType].defaultBrowseTab) {
            this.currentOption$.next(option[0]);
            void this.router.navigate([option.routerLink], { queryParams: option.params });
            break;
          }
        }
      });
    }
  }
  // END TAMU Customization

  // TAMU Customization
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
  // END TAMU Customization

}
