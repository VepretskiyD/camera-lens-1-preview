// variables

var EVENTS = {
  FILTERS: {
    CHANGED: 'filters-changes',
    CLEARED: 'filters-cleared',
    SELECT_ALL: 'filters-select-all-lineups',
    RESTORED: 'filters-restored',
  },
  PRODUCTS: {
    ITEM_ACTIVATED: 'product-activated',
  },
  PRODUCT_SLIDE: {
    SLIDE_CLICK: 'product-slide-click',
  },
  COMPARISON: {
    FILTER_CHECKED: 'comparison-filtered-by-checked',
    BODY_IMG_CLICK: 'comparison-body-img-click',
    PRODUCT_IMG_CLICK: 'comparison-product-img-click',
  },
};

var PHOTO_LABELS = [
  'Wide',
  'Focus',
  'Micro',
  'Macro'
];

var SIZE_IMG = {
  '35mmフルサイズ': 'https://d3cej1t8rg2izd.cloudfront.net/camera-lens-finder/img/full.png',
  'APS-C': 'https://d3cej1t8rg2izd.cloudfront.net/camera-lens-finder/img/aps-c.png',
};

var ANIMATIONS = {
  FADE_IN: {
    ENTER: 'fade-in-enter',
    ENTER_ACTIVE: 'fade-in-enter-active',
    LEAVE: 'fade-in-leave',
    LEAVE_ACTIVE: 'fade-in-leave-active'
  }
};

var COMPARISON_FILTER_KEYS = ['size'];

// mobile menu
function Menu(bus, menuEl, menuToggleEl) {
  var isExpanded = false;

  function expand() {
    isExpanded = true;
    menuEl.style.height = menuEl.scrollHeight + 'px';
    setTimeout(function() {
      menuEl.style.height = 'auto';
    }, 300); 
    menuToggleEl.classList.add('filter__mobile-menu__toggle--opened');
  }

  function collapse() {
    isExpanded = false;
    menuEl.style.height = menuEl.scrollHeight + 'px';
    setTimeout(function() {
      menuEl.style.height = '';
    }, 4);
    menuToggleEl.classList.remove('filter__mobile-menu__toggle--opened');
  }

  function toggle() {
    if (isExpanded) {
      collapse();
    } else {
      expand();
    }
  }

  menuToggleEl.addEventListener('click', toggle);
  this.collapse = collapse;
}
// modal with close button, overlay
function Modal(el, overlayEl, btnCloseEl, backdropEl) {
  var isPending = false;
  overlayEl.addEventListener('click', function(event) {
    if (!event.target.classList.contains('modal__img')) {
      dismiss();
    }
  });
  backdropEl.addEventListener('click', dismiss);
  btnCloseEl.addEventListener('click', dismiss);
  function show(data) {
    if (isPending) {
      return;
    }
    isPending = true;
    el.src = data;
    overlayEl.style.display = 'flex';
    overlayEl.classList.add(ANIMATIONS.FADE_IN.ENTER);
    overlayEl.classList.add(ANIMATIONS.FADE_IN.ENTER_ACTIVE);
    overlayEl.classList.remove(ANIMATIONS.FADE_IN.ENTER);
    setTimeout(function() {
      overlayEl.classList.remove(ANIMATIONS.FADE_IN.ENTER_ACTIVE);
      isPending = false;
    }, 300);
  }
  function dismiss() {
    if (isPending) {
      return;
    }
    isPending = true;
    overlayEl.classList.add(ANIMATIONS.FADE_IN.LEAVE);
    overlayEl.classList.add(ANIMATIONS.FADE_IN.LEAVE_ACTIVE);
    overlayEl.classList.remove(ANIMATIONS.FADE_IN.LEAVE);
    setTimeout(function() {
      overlayEl.classList.remove(ANIMATIONS.FADE_IN.LEAVE_ACTIVE);
      overlayEl.style.display = 'none';
      isPending = false;
    }, 300);
  }
  this.show = show;
  this.dismiss = dismiss;
}
// filters

function Filter(bus, filtersEl, filtersClearBtnEl, filtersBackBtnEl, filtersAsideBtnEl, products) {
  this.get = getFilters;
  this.reset = resetFilters;
  this.showClearFilterOverlay = function () {
    filtersEl.classList.add('filter__wrapper--clear-overlay');
  }
  this.showBackFilterOverlay = function () {
    filtersEl.classList.add('filter__wrapper--back-overlay');
  }

  var lensTabEl = filtersEl.querySelector('[data-filter-name="group"]');
  renderLensTypeTab(lensTabEl);

  function renderLensTypeTab(tabEl) {
    var productsGroups = products
      .map(function(product) {
        return product.group;
      })
      .filter(function(elem, pos,arr) {
        return arr.indexOf(elem) == pos;
      })
      .sort();
    var templates = {
      col: '<div class="filter__section__input__group__col">:ITEMS</div>',
      item: '<div class="filter__section__input__btn">' +
              '<input type="checkbox" id=":ID" class="filter__section__input" data-filter-value=":GROUP">' +
              '<label for=":ID" class="filter__section__input__label">' +
                '<span class="filter__section__input__label__title">:GROUP</span>' +
                '<img class="filter__section__input__label__img" src=":SRC">' +
              '</label>' +
            '</div>'
    };
    var tabHTML = '';
    var itemsHTML = '';
    var currentCol = 0;
    productsGroups.forEach(function (group, index, groups) {
      itemsHTML += templates.item
        .replace(/:ID/g, 'group-' + group)
        .replace(/:GROUP/g, group)
        .replace(':SRC', 'https://picsum.photos/seed/picsum/300/200');
      if (currentCol === 1 || index === groups.length - 1) {
        tabHTML += templates.col
          .replace(':ITEMS', itemsHTML);
        itemsHTML = '';
        currentCol = 0;
      } else {
        currentCol += 1;
      }
    });
    tabEl.innerHTML = tabHTML;
  }

  var filters = {};
  // get all filter inputs
  var inputs = filtersEl.querySelectorAll('input[data-filter-value]');
  // create summary filters object with group name, filter name and value from DOM
  Array.prototype.forEach.call(inputs, function (input) {
    var filterGroup = input.closest('[data-filter-name]').dataset.filterName;
    var filterValue = input.dataset.filterValue;
    if (!filters.hasOwnProperty(filterGroup)) {
      filters[filterGroup] = {};
    }
    filters[filterGroup][filterValue] = {
      state: input.checked,
      el: input
    };
  });

  // return only active filters
  function getFilters() {
    var groupKeys = Object.keys(filters);
    var result = {};
    groupKeys.forEach(function (groupKey) {
      var itemKeys = Object.keys(filters[groupKey]);
      itemKeys.forEach(function (itemKey) {
        if (filters[groupKey][itemKey].state === true) {
          if (!result.hasOwnProperty(groupKey)) {
            result[groupKey] = [];
          }
          result[groupKey].push(itemKey);
        }
      });
    });
    return result;
  }

  filtersClearBtnEl.addEventListener('click', function () {
    filtersEl.classList.remove('filter__wrapper--clear-overlay');
    resetFilters();
    bus.emitEvent(EVENTS.FILTERS.CLEARED);
  });

  filtersBackBtnEl.addEventListener('click', function () {
    filtersEl.classList.remove('filter__wrapper--back-overlay');
    bus.emitEvent(EVENTS.FILTERS.RESTORED);
    bus.emitEvent(EVENTS.FILTERS.CHANGED, [getFilters()]);
  });

  filtersAsideBtnEl.addEventListener('click', function () {
    bus.emitEvent(EVENTS.FILTERS.SELECT_ALL);
  });

  // update filters summary on filter input change
  filtersEl.addEventListener('change', function (e) {
    var target = e.target;
    if (target.dataset.filterValue) {
      var filterGroup = target.closest('[data-filter-name]').dataset.filterName;
      var filterValue = target.dataset.filterValue;
      var filterAutoSelect = target.closest('[data-filter-auto-select]')
        ? target.closest('[data-filter-auto-select]').dataset.filterAutoSelect
        : null;
      if (filterAutoSelect && target.checked) {
        autoSelect(filterGroup, filterValue);
      }
      filters[filterGroup][filterValue].state = target.checked;
      bus.emitEvent(EVENTS.FILTERS.CHANGED, [getFilters()]);
    }
    if (target.dataset.filterSwitch) {
      switchFilterTabTo(target.dataset.filterSwitch);
    }
  });

  function switchFilterTabTo(type) {
    var activeTabs = filtersEl.querySelectorAll('.filter__section--tab--active');
    var nextTabs = filtersEl.querySelectorAll('[data-tab=' + type + ']');
    Array.prototype.forEach.call(activeTabs, function(tab) {
      tab.classList.remove('filter__section--tab--active');
    });
    Array.prototype.forEach.call(nextTabs, function(tab) {
      tab.classList.add('filter__section--tab--active');
    });
    resetFilters();
  }

  // preselect previous inputs
  function autoSelect(filterGroup, filterValue) {
    var groupKeys = Object.keys(filters[filterGroup]);
    var currentIndex = groupKeys.indexOf(filterValue);
    for (var i = 0; i < currentIndex; i++) {
      filters[filterGroup][groupKeys[i]].el.checked = true;
      filters[filterGroup][groupKeys[i]].state = true;
    }
    autoSelectionPending = false;
  }

  // reset all filters
  function resetFilters() {
    var groupKeys = Object.keys(filters);
    groupKeys.forEach(function (groupKey) {
      var itemKeys = Object.keys(filters[groupKey]);
      itemKeys.forEach(function (itemKey) {
        filters[groupKey][itemKey].el.checked = false;
        filters[groupKey][itemKey].state = false;
      });
    });
    bus.emitEvent(EVENTS.FILTERS.CHANGED, [getFilters()]);
  }

}
// product grid

function ProductGrid(bus, productGridEl, productGridTitle, products) {
  var grid = null;

  var templates = {
    gridItem: '<div class="item" data-category=":CATEGORY" data-size=":SIZE" data-group=":GROUP" data-price=":PRICE" data-index=":INDEX">' +
                '<div class="item-content">' +
                  '<div class="product-detail__grid__item__wrapper">' +
                    '<div class="product-detail__grid__item">' +
                      '<img src=":SRC" class="product-detail__grid__item__img">' +
                      '<p class="product-detail__grid__item__price">:PRICE</p>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>',
    gridTitle: 'Filtered Results :FILTERED <span class="product-detail__grid__title--small">(of :TOTAL items in total)</span>',
  }

  this.init = function() {
    renderGridItems();
    sortByPrice();
    renderGridTitle();
    if (grid) {
      activateItem(grid.getItems()[0].getElement().dataset.index);
    }
    productGridEl.addEventListener('click', function(e) {
      var target = e.target;
      var index = null;
      if (target.dataset.index) {
        index = target.dataset.index;
      }
      if (target.closest('[data-index]')) {
        index = target.closest('[data-index]').dataset.index;
      }
      if (index) {
        activateItem(index);
      }
    });
  }

  this.filterBy = function(filterData) {
    sortByPrice();
    filterGrid(filterData);
    renderGridTitle();
  }

  function renderGridItems() {
    var mql = window.matchMedia('(max-width: 767px)');
    products.forEach(function(product, index) {
      productGridEl.insertAdjacentHTML('beforeend', templates.gridItem
        .replace(':SRC', product.image_url)
        .replace(':PRICE', product.price)
        .replace(':CATEGORY', product.category.join('|||'))
        .replace(':SIZE', product.size)
        .replace(':PRICE', '$' + (product.price / 100))
        .replace(':INDEX', index)
        .replace(':GROUP', product.group));
    });
    grid = new Muuri(productGridEl, {
      layout: {
        horizontal: mql.matches,
        rounding: true,
      }
    });
    window.grid = grid;
    function screenTest(e) {
      grid.destroy();
      grid = new Muuri(productGridEl, {
        layout: {
          horizontal: e.matches,
          rounding: true,
        }
      });
    }
    mql.addListener(screenTest);
  }

  function switchHorizontalGrid(state) {
    if (grid) {
      grid._settings.layout.horizontal = !!state;
    }
  }

  function renderGridTitle() {
    var total = grid
      ? grid.getItems().length
      : products.length;
    var filtered = grid
      ? grid.getItems().filter(function (item) {
        return item.isActive();
      }).length
      : products.length;
    productGridTitle.innerHTML = templates.gridTitle
      .replace(':TOTAL', total)
      .replace(':FILTERED', filtered);
  }

  function filterGrid(filterData) {
    if (grid) {
      grid.filter(function (item) {
        var itemEl = item.getElement();
        var itemProps = {
          group: [itemEl.dataset.group],
          price: [itemEl.dataset.price],
          size: [itemEl.dataset.size],
          category: itemEl.dataset.category.split('|||'),
        };
        var filterKeys = Object.keys(filterData);
        if (!filterKeys.length) {
          return true;
        }
        var matchScheme = {};
        var isMatch = false;
        filterKeys.forEach(function(key) {
          if (itemProps.hasOwnProperty(key)) {
            isMatch = false;
            filterData[key].forEach(function(filterDataVal) {
              if (key === 'price') {
                var priceRange = filterDataVal.split('-');
                var itemPrice = +itemProps[key] / 100;
                var min = priceRange[0] === "" ? itemPrice : +priceRange[0];
                var max = priceRange[1] === "" ? itemPrice : +priceRange[1];
                if (itemPrice >= min && itemPrice <= max) {
                  isMatch = true;
                }
              } else {
                if (itemProps[key].indexOf(filterDataVal) !== -1) {
                  isMatch = true;
                }
              }
            });
            matchScheme[key] = isMatch;
          }
        });
        var matchSchemeKeys = Object.keys(matchScheme);
        return matchSchemeKeys.reduce(function(accumulator, nextKey) {
          return accumulator && matchScheme[nextKey];
        }, matchScheme[matchSchemeKeys[0]]);
      });
    }
  }

  function sortByPrice() {
    if (grid) {
      grid.sort(function (itemA, itemB) {
        var aPrice = parseInt(itemA.getElement().dataset.price);
        var bPrice = parseInt(itemB.getElement().dataset.price);
        return aPrice - bPrice;
      });
    }
  }

  function activateByIndex(index) {
    var item = productGridEl.querySelector('[data-index="' + index + '"] .product-detail__grid__item');
    deactivateItems();
    item.classList.add('product-detail__grid__item--active');
  }

  this.highlightItem = function(index) {
    activateByIndex(index);
  }

  function activateItem(index) {
    activateByIndex(index);
    bus.emitEvent(EVENTS.PRODUCTS.ITEM_ACTIVATED, [products[index]]);
  }

  function deactivateItems() {
    var items = productGridEl.querySelectorAll('.product-detail__grid__item');
    Array.prototype.forEach.call(items, function(item) {
      item.classList.remove('product-detail__grid__item--active');
    })
  }

  function matchComparison(data) {
    grid.filter(function(item) {
      var itemEl = item.getElement();
      var itemIndex = itemEl.dataset.index;
      return data.indexOf(+itemIndex) !== -1;
    }, { layout: false });
    grid.sort(function(itemA, itemB) {
      var itemAEl = itemA.getElement();
      var itemBEl = itemB.getElement();
      var itemAIndex = +itemAEl.dataset.index;
      var itemBIndex = +itemBEl.dataset.index;
      return data.indexOf(itemAIndex) - data.indexOf(itemBIndex);
    });
  }

  this.matchComparison = function(data) {
    matchComparison(data);
    renderGridTitle();
  };
}

// product preview carousel
function ProductPreviewCarousel(bus, productCarouselEl, brandsPrizesEl, sizeItemsEl) {
  var templates = {
    slide: '<div class="swiper-slide">' +
            '<div class="product-detail__preview__carousel__item__wrapper">' +
              '<div class="product-detail__preview__carousel__item">' +
                '<img src=":SRC">' +
              '</div>' +
            '</div>' +
          '</div>',
    brandPrizeIcons: '<div class="product-detail__preview__info__brands-prizes">' +
                      '<div class="product-detail__preview__info__brands">:BRANDS</div>' +
                      '<div class="product-detail__preview__info__prizes">:PRIZES</div>' +
                    '</div>',
    brandPrizeIcon: '<div class="product-detail__preview__info__brands-prizes__item">' +
                      '<img class="product-detail__preview__info__brands-prizes__img" src=":SRC">' +
                    '</div>',
    size: '<div class="product-detail__preview__info__size">:SIZE_ITEMS</div>',
    sizeItem: '<div class="product-detail__preview__info__size__item" data-active=":ACTIVE">' +
                '<div class="w-100 h-100">' +
                  '<img class="product-detail__preview__info__brands-prizes__img" src=":SRC">' +
                '</div>' +
              '</div>',
  }
  var topCarousel = null;
  var thumbsCarousel = null;

  function removeAllSlides() {
    topCarousel.removeAllSlides();
    thumbsCarousel.removeAllSlides();
  }
  function renderPreview(productImg) {
    productImg.forEach(function(img, index) {
      topCarousel.addSlide(index, templates.slide.replace(':SRC', img));
      thumbsCarousel.addSlide(index, templates.slide.replace(':SRC', img));
    });
  }
  function renderBrandsPrizes(product) {
    var brandsHtml = '';
    var brands = product.brand_src.filter(function(brand) {
      return brand.length;
    });
    brands.forEach(function(brand) {
      brandsHtml += templates.brandPrizeIcon
        .replace(':SRC', brand);
    });
    var prizesHtml = '';
    var prizes = product.prize_src.filter(function(prize) {
      return prize.length;
    });
    prizes.forEach(function(prize) {
      prizesHtml += templates.brandPrizeIcon
        .replace(':SRC', prize);
    });
    brandsPrizesEl.innerHTML = templates.brandPrizeIcons
      .replace(':BRANDS', brandsHtml)
      .replace(':PRIZES', prizesHtml);
  }
  function renderSize(product) {
    var sizeKeys = Object.keys(SIZE_IMG);
    var html = '';
    sizeKeys.forEach(function(key) {
      html += templates.sizeItem
        .replace(':SRC', SIZE_IMG[key])
        .replace(':ACTIVE', product.size === key);
    });
    sizeItemsEl.innerHTML = templates.size
      .replace(':SIZE_ITEMS', html);
  }
  function init() {
    thumbsCarousel = new Swiper(productCarouselEl.querySelector('.gallery-thumbs'), {
      spaceBetween: 10,
      slidesPerView: 2,
      freeMode: true,
      watchSlidesVisibility: true,
      watchSlidesProgress: true,
    });
    topCarousel = new Swiper(productCarouselEl.querySelector('.gallery-top'), {
      spaceBetween: 10,
      navigation: {
        nextEl: '#js-preview-carousel-next',
        prevEl: '#js-preview-carousel-prev',
      },
      thumbs: {
        swiper: thumbsCarousel
      }
    });
  }

  this.init = init;
  this.renderPreview = function(data) {
    var productImg = [];
    productImg.push(data.image_url);
    productImg.push('img/side_image.png');
    productCarouselEl.style.opacity = 0;
    setTimeout(function() {
      productCarouselEl.style.height = productCarouselEl.getBoundingClientRect().height + 'px';
      removeAllSlides();
      renderPreview(productImg);
    }, 150);
    setTimeout(function() {
      productCarouselEl.style.opacity = '';
      productCarouselEl.style.height = '';
    }, 300);
    renderBrandsPrizes(data);
    renderSize(data);
  };
}

function ProductPreviewInfo(bus, productPreviewInfoEl, productDescriptionEl) {
  var templates = {
    wrapper: '<div class="product-detail__preview__info__inner">' +
                ':HEADER' +
                ':CATEGORY' +
              '</div>' +
              ':BTN',
    header: '<div class="product-detail__preview__info__header">' +
                '<div class="product-detail__preview__info__header__description">:DESCRIPTION</div>' +
                ':SIZE' +
                ':SPECS' +
                ':BRAND_PRIZE_ICONS' +
            '</div>',
    descriptionTitle: '<p class="product-detail__preview__info__description">' +
                        ':DESCRIPTION <span class="product-detail__preview__info__lens-type">(:LENS_TYPE)</span>' +
                      '</p>' +
                      '<p class="product-detail__preview__info__price">:PRICE</p>',
    description: '<p class="product-detail__preview__info__description">:DESCRIPTION</p>' +
                '<p class="product-detail__preview__info__lens-type">(:LENS_TYPE)</p>' +
                '<p class="product-detail__preview__info__price">:PRICE</p>',
    size: '<div class="product-detail__preview__info__size">:SIZE_ITEMS</div>',
    sizeItem: '<div class="product-detail__preview__info__size__item" data-active=":ACTIVE">' +
                '<div class="w-100 h-100">' +
                  '<img class="product-detail__preview__info__brands-prizes__img" src=":SRC">' +
                '</div>' +
              '</div>',
    specs: '<p class="product-detail__preview__info__other">MINIMUM APERTURE (F): :MIN_APERTURE</p>' +
            '<p class="product-detail__preview__info__other">FOCAL LENGTH (MM): :FOCAL_LENGTH</p>' +
            '<p class="product-detail__preview__info__other">MAXIMUM MAGNIFICATION RATIO: (X): :MAX_MAGNIFICATION_RATIO</p>' +
            '<p class="product-detail__preview__info__other">WEIGHT: :WEIGHT</p>',
    brandPrizeIcons: '<div class="product-detail__preview__info__brands-prizes">' +
                      '<div class="product-detail__preview__info__brands">:BRANDS</div>' +
                      '<div class="product-detail__preview__info__prizes">:PRIZES</div>' +
                    '</div>',
    brandPrizeIcon: '<div class="product-detail__preview__info__brands-prizes__item">' +
                      '<img class="product-detail__preview__info__brands-prizes__img" src=":SRC">' +
                    '</div>',
    category: '<div class="product-detail__preview__info__category__wrapper">' +
                '<div class="product-detail__preview__info__category" data-category="person&animals"><span class="product-detail__preview__info__category__title">Person Animal</span></div>' +
                '<div class="product-detail__preview__info__category" data-category="landscape"><span class="product-detail__preview__info__category__title">Land scape</span></div>' +
                '<div class="product-detail__preview__info__category" data-category="flowers&foods"><span class="product-detail__preview__info__category__title">Flower Food</span></div>' +
                '<div class="product-detail__preview__info__category" data-category="moving&objects"><span class="product-detail__preview__info__category__title">Moving Objects</span></div>' +
              '</div>',
    btn: '<a href=":HREF" target="_blank" class="product-detail__preview__info__btn">' +
            '<img class="product-detail__preview__info__btn__img" src="https://picsum.photos/seed/picsum/200/200">Go to product page' +
          '</a>'
  };

  function renderHeader(product) {
    var descriptionHtml = templates.description
      .replace(':DESCRIPTION', product.MPN)
      .replace(':LENS_TYPE', product.group)
      .replace(':PRICE', 'Price: $' + product.price / 100 + ' + Tax');
    var sizeHtml = templates.size
      .replace(':SIZE_ITEMS', renderSizeItems(product));
    var specsHtml = templates.specs
      .replace(':MIN_APERTURE', '-')
      .replace(':FOCAL_LENGTH', '-')
      .replace(':MAX_MAGNIFICATION_RATIO', '-')
      .replace(':WEIGHT', '-');
    return templates.header
      .replace(':DESCRIPTION', descriptionHtml)
      .replace(':SIZE', sizeHtml)
      .replace(':SPECS', specsHtml)
      .replace(':BRAND_PRIZE_ICONS', renderBrandPrizeIcons(product));
  }

  function renderSizeItems(product) {
    var sizeKeys = Object.keys(SIZE_IMG);
    var html = '';
    sizeKeys.forEach(function(key) {
      html += templates.sizeItem
        .replace(':SRC', SIZE_IMG[key])
        .replace(':ACTIVE', product.size === key);
    });
    return html;
  }

  function renderBrandPrizeIcons(product) {
    var brandsHtml = '';
    var brands = product.brand_src.filter(function(brand) {
      return brand.length;
    });
    brands.forEach(function(brand) {
      brandsHtml += templates.brandPrizeIcon
        .replace(':SRC', brand);
    });
    var prizesHtml = '';
    var prizes = product.prize_src.filter(function(prize) {
      return prize.length;
    });
    prizes.forEach(function(prize) {
      prizesHtml += templates.brandPrizeIcon
        .replace(':SRC', prize);
    });
    return templates.brandPrizeIcons
      .replace(':BRANDS', brandsHtml)
      .replace(':PRIZES', prizesHtml);
  }

  function renderCategory(product) {
    return templates.category;
  }

  function renderBtn(product) {
    return templates.btn
      .replace(':HREF', product.shop_url);
  }

  function renderPreview(product) {
    productPreviewInfoEl.innerHTML = templates.wrapper
      .replace(':HEADER', renderHeader(product))
      .replace(':CATEGORY', renderCategory(product))
      .replace(':BTN', renderBtn(product));
    var categories = productPreviewInfoEl.querySelectorAll('[data-category]');
    Array.prototype.forEach.call(categories, function(category) {
      if (product.category.indexOf(category.dataset.category) !== -1) {
        category.classList.add('product-detail__preview__info__category--active');
      }
    });
    productDescriptionEl.innerHTML = templates.descriptionTitle
      .replace(':DESCRIPTION', product.MPN)
      .replace(':LENS_TYPE', product.group)
      .replace(':PRICE', 'Price: $' + product.price / 100 + ' + Tax');
  }

  this.renderPreview = renderPreview;
}
function ProductSlide(bus, slideInfo, productSlideEl, productCommentEl, productSlideInfoEl) {
  var template = '<div class="swiper-slide" data-filename=":FILENAME">' +
                    '<div class="product-gallery__item__wrapper">' +
                      '<div class="product-gallery__item">' +
                        '<img src=":SRC">' +
                      '</div>' +
                    '</div>' +
                  '</div>';
  var slideInfoTemplate = '<span class="hidden">:CONTRIBUTOR</span>' +
                          '<span>:SETTINGS</span>' +
                          '<span>:CONTRIBUTOR</span';
  var topCarousel = null;
  var thumbsCarousel = null;
  var slideInfoKeys = [];
  var slidesImg = [];

  function getSlideInfo(filename) {
    var info = {
      settings: '',
      contributor: ''
    };
    var index = slideInfoKeys.findIndex(function(item) {
      return item === filename;
    });
    var data = slideInfo[index];
    if (data) {
      info.settings = data.iso_sensitivity + ' ' + data.focal_ratio + ' ' + data.shutter_speed;
      info.contributor = data.attribution;
    }
    return info;
  }

  function removeAllSlides() {
    topCarousel.removeAllSlides();
    thumbsCarousel.removeAllSlides();
  }
  function renderGallery(productImg) {
    slidesImg = productImg;
    productImg.forEach(function(img, index) {
      topCarousel.addSlide(index, template
        .replace(':SRC', img)
        .replace(':FILENAME', img.split('/').pop()));
      thumbsCarousel.addSlide(index, template.replace(':SRC', img));
    });
  }
  function renderGallerySlideInfo(slide) {
    var slideData = getSlideInfo(slide.dataset.filename);
    productSlideInfoEl.innerHTML = slideInfoTemplate
      .replace(':SETTINGS', slideData.settings)
      .replace(/:CONTRIBUTOR/g, slideData.contributor);
  }
  function init() {
    thumbsCarousel = new Swiper(productSlideEl.querySelector('.gallery-thumbs'), {
      spaceBetween: 10,
      slidesPerView: 5,
      freeMode: true,
      watchSlidesVisibility: true,
      watchSlidesProgress: true,
      centerInsufficientSlides: true,
    });
    topCarousel = new Swiper(productSlideEl.querySelector('.gallery-top'), {
      spaceBetween: 10,
      navigation: {
        nextEl: '#js-gallery-carousel-next',
        prevEl: '#js-gallery-carousel-prev',
      },
      thumbs: {
        swiper: thumbsCarousel
      },
      on: {
        slideChangeTransitionEnd: function(el) {
          renderGallerySlideInfo(el.slides[el.activeIndex]);
        },
        click: function(el) {
          bus.emitEvent(EVENTS.PRODUCT_SLIDE.SLIDE_CLICK, [slidesImg[el.activeIndex]]);
        },
      }
    });
    slideInfoKeys = slideInfo.map(function(item) {
      return item.filename;
    });
  }

  this.init = init;
  this.renderGallery = function(data) {
    productSlideEl.style.opacity = 0;
    setTimeout(function() {
      productSlideEl.style.height = productSlideEl.getBoundingClientRect().height + 'px';
      removeAllSlides();
      renderGallery(data.slides_src);
    }, 150);
    setTimeout(function() {
      productCommentEl.innerHTML = data.comment;
      renderGallerySlideInfo(topCarousel.slides[topCarousel.activeIndex]);
      productSlideEl.style.opacity = '';
      productSlideEl.style.height = '';
    }, 300);
  };
}
// product comparison
function ProductComparison(bus, productComparisonEl, productComparisonBtnEl, products) {
  var checkedProducts = [];
  var productsByGroup = {};
  this._isVisible = false;
  this.show = function() {
    if (!this._isVisible) {
      this._isVisible = true;
      productComparisonEl.classList.add('product-compare--visible');
    }
  }
  this.hide = function() {
    if (this._isVisible) {
      this._isVisible = false;
      productComparisonEl.classList.remove('product-compare--visible');
    }
  }
  var self = this;
  var productsGroups = products
    .map(function(product) {
      return product.group;
    })
    .filter(function(elem, pos,arr) {
      return arr.indexOf(elem) == pos;
    })
    .sort();
  productsGroups.forEach(function(group) {
    productsByGroup[group] = [];
  });
  var productsCols = [];
  products.forEach(function(product, index) {
    var item = {
      data: product,
      el: null,
      input: null,
      checked: false,
      visible: true,
      index: index,
      group: product.group
    };
    productsByGroup[product.group].push(item);
    productsCols.push(item);
  });

  var templates = {
    col: '<div class="product-compare__col" data-section-product-group=":GROUP">' +
          ':HEADER' +
          ':BODY' +
        '</div>',
    header: {
      wrapper: '<div class="product-compare__header" data-section-product-group=":GROUP">' +
                  '<div class="product-compare__header__row__wrapper">' +
                    ':LABEL' +
                    '<div class="product-compare__header__row">' +
                      ':ITEMS' +
                    '</div>' +
                  '</div>' +
                '</div>',
      label: '<div class="product-compare__header__label">' +
                '<div class="product-compare__header__label__inner">:GROUP</div>' +
              '</div>',
      item: '<div class="product-compare__header__item" data-header-item data-product-group=":GROUP" data-product-index=":INDEX">' +
              '<div class="product-compare__header__item__label">' +
                '<div class="product-compare__header__item__checkbox">' +
                  '<input class="product-compare__header__item__checkbox__input" type="checkbox" id=":ID">' +
                  '<label class="product-compare__header__item__checkbox__label" for=":ID">&check;</label>' +
                '</div>' +
                '<div class="product-compare__header__item__group">:GROUP</div>' +
                '<img src=":SRC" class="product-compare__header__item__product-img">' +
                '<p class="product-compare__header__item__product-name">:NAME</p>' +
                '<p class="product-compare__header__item__product-price">:PRICE</p>' +
              '</div>' +
            '</div>',
    },
    body: {
      wrapper: '<div class="product-compare__body" data-section-product-group=":GROUP">:ROWS</div>',
      row: '<div class="product-compare__body__row__wrapper">' +
              ':LABEL' +
              '<div class="product-compare__body__row">' +
                ':ITEMS' +
              '</div>' +
            '</div>',
      rowLabel: '<div class="product-compare__body__label">:LABEL</div>',
      rowItem: '<div class="product-compare__body__item" data-product-group=":GROUP" data-product-index=":INDEX">' +
                  '<img src=":SRC" class="product-compare__body__item__img">' +
                '</div>',
    }
  };

  function init() {
    var groupKeys = Object.keys(productsByGroup);
    groupKeys.forEach(function(key) {
      var headerHTML = renderHeader(key, productsByGroup[key]);
      var bodyHTML = renderBody(key, productsByGroup[key]);
      var colHTML = templates.col
        .replace(':GROUP', key)
        .replace(':HEADER', headerHTML)
        .replace(':BODY', bodyHTML);
      productComparisonEl.insertAdjacentHTML('beforeend', colHTML);
    });
    var itemsEl = productComparisonEl.querySelectorAll('[data-header-item][data-product-index][data-product-group]');
    Array.prototype.forEach.call(itemsEl, function(item) {
      var itemIndex = item.dataset.productIndex;
      var itemCheckbox = item.querySelector('input[type="checkbox"]');
      var index = productsCols.findIndex(function(product) {
        return product.index == itemIndex;
      });
      var productObj = productsCols[index];
      productObj.el = item;
      productObj.input = itemCheckbox;
      productObj.checked = itemCheckbox.checked;
    });

    productComparisonEl.addEventListener('change', function(e) {
      var target = e.target;
      var productEl = target.closest('[data-product-index][data-product-group]');
      if (productEl) {
        var itemIndex = productEl.dataset.productIndex;
        var index = productsCols.findIndex(function(product) {
          return product.index == itemIndex;
        });
        productsCols[index].checked = target.checked;
      }
    });

    productComparisonEl.addEventListener('click', function(event) {
      var target = event.target;
      if (target.classList.contains('product-compare__body__item__img')) {
        bus.emitEvent(EVENTS.COMPARISON.BODY_IMG_CLICK, [target.getAttribute('src')]);
      }
      if (target.classList.contains('product-compare__header__item__product-img')) {
        var productEl = target.closest('[data-product-index][data-product-group]');
        var itemIndex = productEl.dataset.productIndex;
        var index = productsCols.findIndex(function(product) {
          return product.index == itemIndex;
        });
        var item = productsCols[index];
        bus.emitEvent(EVENTS.COMPARISON.PRODUCT_IMG_CLICK, [{ data: item.data, index: item.index }]);
      }
    });

    function clickHandler() {
      if (self._isVisible) {
        bus.emitEvent(EVENTS.COMPARISON.FILTER_CHECKED, [getChecked(), true]);
      }
      self.hide();
    }
    productComparisonBtnEl.addEventListener('click', clickHandler);
  }

  function renderHeader(groupName, groupProducts) {
    var headerLabelHTML = templates.header.label.replace(':GROUP', groupName);
    var headerItemsHTML = '';
    groupProducts.forEach(function(product) {
      headerItemsHTML += templates.header.item
        .replace(':INDEX', product.index)
        .replace(/:ID/g, groupName + '-' + product.index)
        .replace(/:GROUP/g, product.data.group)
        .replace(':SRC', product.data.image_url)
        .replace(':NAME', product.data.MPN)
        .replace(':PRICE', '$' + product.data.price / 100);
    });
    var headerHTML = templates.header.wrapper
      .replace(':GROUP', groupName)
      .replace(':LABEL', headerLabelHTML)
      .replace(':ITEMS', headerItemsHTML)
    return headerHTML;
  }

  function renderBody(groupName, groupProducts) {
    var bodyRowsHTML = '';
    PHOTO_LABELS.forEach(function(label, labelIndex) {
      var rowItems = '';
      groupProducts.forEach(function(product) {
        rowItems += templates.body.rowItem
          .replace(':INDEX', product.index)
          .replace(':GROUP', product.data.group)
          .replace(':SRC', product.data.cells_src[labelIndex]);
      });
      var rowLabel = templates.body.rowLabel.replace(':LABEL', label);
      bodyRowsHTML += templates.body.row
      .replace(':LABEL', rowLabel)
      .replace(':ITEMS', rowItems);
    });
    var bodyHTML = templates.body.wrapper
      .replace(':GROUP', groupName)
      .replace(':ROWS', bodyRowsHTML);
    return bodyHTML;
  }

  var activeProduct = null;

  function highlightActive(data) {
    var activeProductIndex = productsCols.findIndex(function(product) {
      return product.data === data;
    });
    if (activeProductIndex !== -1) {
      if (activeProduct !== null) {
        Array.prototype.forEach.call(
          productComparisonEl.querySelectorAll('[data-section-product-group="' + activeProduct.dataset.productGroup + '"]'),
          function(el) {
            el.classList.remove('product-compare__active-group');
          }
        );
        activeProduct.classList.remove('product-compare__header__item--active');
      }
      activeProduct = productsCols[activeProductIndex].el;
      Array.prototype.forEach.call(
        productComparisonEl.querySelectorAll('[data-section-product-group="' + data.group + '"]'),
        function(el) {
          el.classList.add('product-compare__active-group');
        }
      );
      activeProduct.classList.add('product-compare__header__item--active');
    }
  }

  function showItems(key, index) {
    var itemsToShow = productComparisonEl
      .querySelectorAll('[data-product-group="' + key + '"][data-product-index="' + index + '"]');
    Array.prototype.forEach.call(itemsToShow, function(item) {
      item.style.display = '';
    });
    productsCols[index].visible = true;
  }

  function hideItems(key, index) {
    var itemsToHide = productComparisonEl
      .querySelectorAll('[data-product-group="' + key + '"][data-product-index="' + index + '"]');
    Array.prototype.forEach.call(itemsToHide, function(item) {
      item.style.display = 'none';
    });
    productsCols[index].visible = false;
  }

  function toggleGroups() {
    var groupKeys = Object.keys(productsByGroup);
    groupKeys.forEach(function(key) {
      var groupVisible = productsCols
        .filter(function(item) {
          return item.group === key && item.visible;
        })
        .length;
      var groupEl = productComparisonEl
        .querySelector('[data-section-product-group="' + key + '"]');
      groupEl.style.display = groupVisible ? '' : 'none';
    });
  }

  function getChecked() {
    checkedProducts = [];
    productsCols.forEach(function(product) {
      if (product.checked) {
        checkedProducts.push(product.index);
      }
    });
    return checkedProducts;
  }

  function filterBy(filtersData) {
    var filterKeys = Object.keys(filtersData);
    if (filterKeys.length) {
      filterKeys.forEach(function(filterKey) {
        productsCols.forEach(function(product) {
          if (product.data.hasOwnProperty(filterKey)
            && filtersData[filterKey].includes(product.data[filterKey])) {
              showItems(product.group, product.index);
            } else {
              hideItems(product.group, product.index);
              product.input.checked = false;
              product.checked = false;
            }
        });
      });
    } else {
      productsCols.forEach(function(product) {
        showItems(product.group, product.index);
      });
    }
    toggleGroups();
    
  }

  function reset() {
    productsCols.forEach(function(product) {
      if (!product.checked) {
        showItems(product.group, product.index);
      } else {
        product.input.checked = false;
        product.checked = false;
      }
    });
    toggleGroups();
  }

  function scroll() {
    productComparisonEl
      .closest('.product-compare__wrapper')
      .scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  this.reset = reset;
  this.init = init;
  this.highlightActive = highlightActive;
  this.scroll = scroll;
  this.filterBy = filterBy;
}
// product comparison checked
function ProductComparisonChecked(bus, productComparisonEl, productComparisonBtnEl, products) {
  var checkedProducts = [];
  this._isVisible = false;
  this.show = function() {
    if (!this._isVisible) {
      this._isVisible = true;
      productComparisonEl.classList.add('product-compare--visible');
    }
  }
  this.hide = function() {
    if (this._isVisible) {
      this._isVisible = false;
      productComparisonEl.classList.remove('product-compare--visible');
    }
  }
  var self = this;
  var productsCols = [];
  products.forEach(function(product, index) {
    var item = {
      data: product,
      el: null,
      input: null,
      checked: false,
      visible: true,
      index: index,
      group: product.group
    };
    productsCols.push(item);
  });

  productsCols.sort(function(productA, productB) {
    return productA.data.price - productB.data.price;
  });

  var templates = {
    header: {
      wrapper: '<div class="product-compare__header">' +
                  '<div class="product-compare__header__row__wrapper">' +
                    ':LABEL' +
                    '<div class="product-compare__header__row">' +
                      ':ITEMS' +
                    '</div>' +
                  '</div>' +
                '</div>',
      label: '<div class="product-compare__header__label">' +
                '<div class="product-compare__header__label__inner">:GROUP</div>' +
              '</div>',
      item: '<div class="product-compare__header__item" data-header-item data-product-group=":GROUP" data-product-index=":INDEX">' +
              '<div class="product-compare__header__item__label">' +
                '<div class="product-compare__header__item__checkbox">' +
                  '<input class="product-compare__header__item__checkbox__input" type="checkbox" id=":ID">' +
                  '<label class="product-compare__header__item__checkbox__label" for=":ID">&check;</label>' +
                '</div>' +
                '<div class="product-compare__header__item__group">:GROUP</div>' +
                '<img src=":SRC" class="product-compare__header__item__product-img">' +
                '<p class="product-compare__header__item__product-name">:NAME</p>' +
                '<p class="product-compare__header__item__product-price">:PRICE</p>' +
              '</div>' +
            '</div>',
    },
    body: {
      wrapper: '<div class="product-compare__body">:ROWS</div>',
      row: '<div class="product-compare__body__row" data-product-group=":GROUP" data-product-index=":INDEX">' +
              ':ITEMS' +
            '</div>',
      labelsRow: '<div class="product-compare__body__row product-compare__body__row--labels">' +
              ':ITEMS' +
            '</div>',
      rowLabel: '<div class="product-compare__body__label">:LABEL</div>',
      rowItem: '<div class="product-compare__body__item">' +
                  '<img src=":SRC" class="product-compare__body__item__img">' +
                '</div>',
    }
  };
  function init() {
    var bodyRowsHTML = '';
    bodyRowsHTML += renderCheckedBody();
    productsCols.forEach(function(product) {
      bodyRowsHTML += renderBody(product);
    });
    var bodyHTML = templates.body.wrapper
      .replace(':ROWS', bodyRowsHTML);
    
    productComparisonEl.insertAdjacentHTML('beforeend', renderHeader());
    productComparisonEl.insertAdjacentHTML('beforeend', bodyHTML);

    var itemsEl = productComparisonEl.querySelectorAll('[data-header-item][data-product-index][data-product-group]');
    Array.prototype.forEach.call(itemsEl, function(item) {
      var itemIndex = item.dataset.productIndex;
      var itemCheckbox = item.querySelector('input[type="checkbox"]');
      var index = productsCols.findIndex(function(product) {
        return product.index == itemIndex;
      });
      var productObj = productsCols[index];
      productObj.el = item;
      productObj.input = itemCheckbox;
      productObj.checked = itemCheckbox.checked;
    });

    productComparisonEl.addEventListener('change', function(e) {
      var target = e.target;
      var productEl = target.closest('[data-product-index][data-product-group]');
      if (productEl) {
        var itemIndex = productEl.dataset.productIndex;
        var index = productsCols.findIndex(function(product) {
          return product.index == itemIndex;
        });
        productsCols[index].checked = target.checked;
      }
    });

    productComparisonEl.addEventListener('click', function(event) {
      var target = event.target;
      if (target.classList.contains('product-compare__body__item__img')) {
        bus.emitEvent(EVENTS.COMPARISON.BODY_IMG_CLICK, [target.getAttribute('src')]);
      }
      if (target.classList.contains('product-compare__header__item__product-img')) {
        var productEl = target.closest('[data-product-index][data-product-group]');
        var itemIndex = productEl.dataset.productIndex;
        var index = productsCols.findIndex(function(product) {
          return product.index == itemIndex;
        });
        var item = productsCols[index];
        bus.emitEvent(EVENTS.COMPARISON.PRODUCT_IMG_CLICK, [{ data: item.data, index: item.index }]);
      }
    });

    function clickHandler() {
      if (self._isVisible) {
        bus.emitEvent(EVENTS.COMPARISON.FILTER_CHECKED, [getChecked(), false]);
        filterChecked();
      }
      self.show();
    }
    productComparisonBtnEl.addEventListener('click', clickHandler);
  }

  function renderHeader() {
    var headerLabelHTML = templates.header.label.replace(':GROUP', 'Checked');
    var headerItemsHTML = '';
    productsCols.forEach(function(product) {
      headerItemsHTML += templates.header.item
        .replace(':INDEX', product.index)
        .replace(/:ID/g, 'checked' + product.group + '-' + product.index)
        .replace(/:GROUP/g, product.data.group)
        .replace(':SRC', product.data.image_url)
        .replace(':NAME', product.data.MPN)
        .replace(':PRICE', '$' + product.data.price / 100);
    });
    var headerHTML = templates.header.wrapper
      .replace(':LABEL', headerLabelHTML)
      .replace(':ITEMS', headerItemsHTML)
    return headerHTML;
  }

  function renderCheckedBody() {
    var rowItemsHTML = '';
    PHOTO_LABELS.forEach(function(label) {
      rowItemsHTML += templates.body.rowLabel.replace(':LABEL', label);
    });
    return templates.body.labelsRow
      .replace(':ITEMS', rowItemsHTML);
  }

  function renderBody(product) {
    var rowItemsHTML = '';
    PHOTO_LABELS.forEach(function(label, labelIndex) {
      rowItemsHTML += templates.body.rowItem
        .replace(':SRC', product.data.cells_src[labelIndex]);
    });
    return templates.body.row
      .replace(':INDEX', product.index)
      .replace(':GROUP', product.group)
      .replace(':ITEMS', rowItemsHTML);
  }

  var activeProduct = null;

  function highlightActive(data) {
    var activeProductIndex = productsCols.findIndex(function(product) {
      return product.data === data;
    });
    if (activeProductIndex !== -1) {
      if (activeProduct !== null) {
        activeProduct.classList.remove('product-compare__header__item--active');
      }
      activeProduct = productsCols[activeProductIndex].el;
      activeProduct.classList.add('product-compare__header__item--active');
    }
  }

  function showItems(key, index) {
    var itemsToShow = productComparisonEl
      .querySelectorAll('[data-product-group="' + key + '"][data-product-index="' + index + '"]');
    Array.prototype.forEach.call(itemsToShow, function(item) {
      item.style.display = '';
    });
    productsCols[index].visible = true;
  }

  function hideItems(key, index) {
    var itemsToHide = productComparisonEl
      .querySelectorAll('[data-product-group="' + key + '"][data-product-index="' + index + '"]');
    Array.prototype.forEach.call(itemsToHide, function(item) {
      item.style.display = 'none';
    });
    productsCols[index].visible = false;
  }

  function getChecked() {
    checkedProducts = [];
    productsCols.forEach(function(product) {
      if (product.checked) {
        checkedProducts.push(product.index);
      }
    });
    return checkedProducts;
  }

  function filterChecked() {
    checkedProducts = [];
    productsCols.forEach(function(product) {
      if (!product.checked) {
        hideItems(product.group, product.index);
      } else {
        checkedProducts.push(product.index);
      }
    });
  }

  function filterBy(filtersData) {
    var filterKeys = Object.keys(filtersData);
    if (filterKeys.length) {
      filterKeys.forEach(function(filterKey) {
        productsCols.forEach(function(product) {
          if (product.data.hasOwnProperty(filterKey)
            && filtersData[filterKey].includes(product.data[filterKey])) {
              showItems(product.group, product.index);
            } else {
              hideItems(product.group, product.index);
              product.input.checked = false;
              product.checked = false;
            }
        });
      });
    } else {
      productsCols.forEach(function(product) {
        showItems(product.group, product.index);
      });
    }
  }

  function setChecked(checkedItems) {
    productsCols.forEach(function(product) {
      if (checkedItems.indexOf(product.index) !== -1) {
        product.input.checked = true;
        product.checked = true;
        showItems(product.group, product.index);
      } else {
        product.input.checked = false;
        product.checked = false;
        hideItems(product.group, product.index);
      }
    });
    return getChecked();
  }

  function reset() {
    productsCols.forEach(function(product) {
      if (!product.checked) {
        showItems(product.group, product.index);
      } else {
        product.input.checked = false;
        product.checked = false;
      }
    });
  }

  function scroll() {
    productComparisonEl
      .closest('.product-compare__wrapper')
      .scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  this.reset = reset;
  this.init = init;
  this.highlightActive = highlightActive;
  this.scroll = scroll;
  this.filterBy = filterBy;
  this.setChecked = setChecked;
}
// script
var bus = new EventEmitter();

// modal
var modal = new Modal(
    document.getElementById('modal-img'),
    document.getElementById('modal-overlay'),
    document.getElementById('modal-btn-close'),
    document.getElementById('modal-backdrop')
);

window.modalShow = modal.show;
window.modalDismiss = modal.dismiss;

// mobile menu
var menu = new Menu(
    bus,
    document.getElementById('mobile-menu'),
    document.getElementById('mobile-menu-toggle')
);

// filters
var filter = new Filter(
    bus,
    document.getElementById('filters'),
    document.getElementById('filters-clear-btn'),
    document.getElementById('filters-back-btn'),
    document.getElementById('filters-aside-btn'),
    products
);

// product detail
// product preview carousel
var productPreviewCarousel = new ProductPreviewCarousel(
    bus,
    document.getElementById('selected-product-carousel'),
    document.getElementById('brands-prizes'),
    document.getElementById('sizes')
);
// product preview info
var productPreviewInfo = new ProductPreviewInfo(
    bus,
    document.getElementById('selected-product-info'),
    document.getElementById('product-description')
);
// product grid
var productGrid = new ProductGrid(
    bus,
    document.getElementById('product-grid'),
    document.getElementById('product-grid-title'),
    products
);
// product slide
var productSlide = new ProductSlide(
    bus,
    slide_info,
    document.getElementById('selected-product-gallery'),
    document.getElementById('selected-product-comment'),
    document.getElementById('selected-product-gallery-slide-info')
);

// product comparison
var productComparison = new ProductComparison(
    bus,
    document.getElementById('product-comparison'),
    document.getElementById('product-compare-show-checked-btn'),
    products
);
var productComparisonChecked = new ProductComparisonChecked(
    bus,
    document.getElementById('product-comparison-checked'),
    document.getElementById('product-compare-show-checked-btn'),
    products
);

productComparison.show();
productComparisonChecked.hide();

var productSection = document.getElementById('product-section');
var productSectionOverlay = false;

function showProductSectionOverlay() {
    if (!productSectionOverlay) {
        productSection.classList.add('product-section-overlay');
    }
    productSectionOverlay = true;
}

function hideProductSectionOverlay() {
    if (productSectionOverlay) {
        productSection.classList.remove('product-section-overlay');
    }
    productSectionOverlay = false;
}

bus.addListener(EVENTS.FILTERS.CHANGED, function(data) {
    productGrid.filterBy(data);
    // prepare filter data for comparison section
    var comparisonFilterData = {};
    Object.keys(data).forEach(function(key) {
        if (COMPARISON_FILTER_KEYS.includes(key)) {
            comparisonFilterData[key] = data[key];
        }
    });
    productComparison.filterBy(comparisonFilterData);
    productComparisonChecked.filterBy(comparisonFilterData);
});
function resetComparison() {
    productComparison.reset();
    productComparison.show();
    productComparisonChecked.hide();
}
bus.addListener(EVENTS.FILTERS.CLEARED, function() {
    resetComparison();
});
bus.addListener(EVENTS.FILTERS.RESTORED, function() {
    resetComparison();
});
bus.addListener(EVENTS.COMPARISON.FILTER_CHECKED, function(data, setChecked) {
    hideProductSectionOverlay();
    filter.showBackFilterOverlay();
    if (setChecked) {
        productGrid.matchComparison(productComparisonChecked.setChecked(data));
    } else {
        productGrid.matchComparison(data);
    }
});
function renderPreview(data) {
    hideProductSectionOverlay();
    productPreviewCarousel.renderPreview(data);
    productPreviewInfo.renderPreview(data);
    productSlide.renderGallery(data);
}
bus.addListener(EVENTS.PRODUCTS.ITEM_ACTIVATED, function(data) {
    renderPreview(data);
    productComparison.highlightActive(data);
    productComparisonChecked.highlightActive(data);
});
bus.addListener(EVENTS.COMPARISON.PRODUCT_IMG_CLICK, function(data) {
    renderPreview(data.data);
    productGrid.highlightItem(data.index);
    productComparison.highlightActive(data.data);
    productComparisonChecked.highlightActive(data.data);
});
bus.addListener(EVENTS.FILTERS.SELECT_ALL, function() {
    menu.collapse();
    showProductSectionOverlay();
    productComparison.scroll();
});
function modalShow(data) {
    modal.show(data);
}
bus.addListener(EVENTS.PRODUCT_SLIDE.SLIDE_CLICK, function(data) {
    modalShow(data);
});
bus.addListener(EVENTS.COMPARISON.BODY_IMG_CLICK, function(data) {
    modalShow(data);
});

productPreviewCarousel.init();
productSlide.init();
productComparison.init();
productComparisonChecked.init();
productGrid.init();
