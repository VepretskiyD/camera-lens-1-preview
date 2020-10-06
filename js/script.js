// variables

var EVENTS = {
  FILTERS: {
    CHANGED: 'filters-changes',
    CLEARED: 'filters-cleared',
    SELECT_ALL: 'filters-select-all-lineups',
  },
  PRODUCTS: {
    ITEM_ACTIVATED: 'product-activated',
  },
  COMPARISON: {
    FILTER_CHECKED: 'comparison-filtered-by-checked',
  }
};

var PHOTO_LABELS = [
  'Wide',
  'Focus',
  'Micro',
  'Macro'
];

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
// filters

function Filter(bus, filtersEl, filtersClearBtnEl, filtersAsideBtnEl, products) {
  this.get = getFilters;
  this.reset = resetFilters;
  this.showClearFilterOverlay = function () {
    filtersEl.classList.add('filter__wrapper--clear-overlay');
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
      }
    });
    window.grid = grid;
    function screenTest(e) {
      grid.destroy();
      grid = new Muuri(productGridEl, {
        layout: {
          horizontal: e.matches,
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

  function activateItem(index) {
    var item = productGridEl.querySelector('[data-index="' + index + '"] .product-detail__grid__item');
    deactivateItems();
    item.classList.add('product-detail__grid__item--active');
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
function ProductPreviewCarousel(bus, productCarouselEl) {
  var template = '<div class="swiper-slide">' +
                    '<div class="product-detail__preview__carousel__item__wrapper">' +
                      '<div class="product-detail__preview__carousel__item">' +
                        '<img src=":SRC">' +
                      '</div>' +
                    '</div>' +
                  '</div>';
  var topCarousel = null;
  var thumbsCarousel = null;

  function removeAllSlides() {
    topCarousel.removeAllSlides();
    thumbsCarousel.removeAllSlides();
  }
  function renderPreview(productImg) {
    productImg.forEach(function(img, index) {
      topCarousel.addSlide(index, template.replace(':SRC', img));
      thumbsCarousel.addSlide(index, template.replace(':SRC', img));
    });
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
  };
}

function ProductPreviewInfo(bus, productPreviewInfoEl) {
  var template = '<div class="product-detail__preview__info__inner">' +
                    '<div class="product-detail__preview__info__header">' +
                      '<p class="product-detail__preview__info__description">:DESCRIPTION</p>' +
                      '<p class="product-detail__preview__info__lens-type">(:LENS_TYPE)</p>' +
                      '<p class="product-detail__preview__info__price">:PRICE</p>' +
                      '<p class="product-detail__preview__info__other">MINIMUM APERTURE (F): :MIN_APERTURE</p>' +
                      '<p class="product-detail__preview__info__other">FOCAL LENGTH (MM): :FOCAL_LENGTH</p>' +
                      '<p class="product-detail__preview__info__other">MAXIMUM MAGNIFICATION RATIO: (X): :MAX_MAGNIFICATION_RATIO</p>' +
                      '<p class="product-detail__preview__info__other">WEIGHT: :WEIGHT</p>' +
                    '</div>' +
                    '<div class="product-detail__preview__info__category__wrapper">' +
                      '<div class="product-detail__preview__info__category" data-category="person&animals"><span class="product-detail__preview__info__category__title">Person Animal</span></div>' +
                      '<div class="product-detail__preview__info__category" data-category="landscape"><span class="product-detail__preview__info__category__title">Land scape</span></div>' +
                      '<div class="product-detail__preview__info__category" data-category="flowers&foods"><span class="product-detail__preview__info__category__title">Flower Food</span></div>' +
                      '<div class="product-detail__preview__info__category" data-category="moving&objects"><span class="product-detail__preview__info__category__title">Moving Objects</span></div>' +
                    '</div>' +
                  '</div>' +
                  '<a href=":HREF" target="_blank" class="product-detail__preview__info__btn">' +
                    '<img class="product-detail__preview__info__btn__img" src="https://picsum.photos/seed/picsum/200/200">Go to product page' +
                  '</a>';

  function renderPreview(product) {
    productPreviewInfoEl.innerHTML = template
      .replace(':DESCRIPTION', product.MPN)
      .replace(':LENS_TYPE', product.group)
      .replace(':PRICE', 'Price: $' + product.price / 100 + ' + Tax')
      .replace(':MIN_APERTURE', '-')
      .replace(':FOCAL_LENGTH', '-')
      .replace(':MAX_MAGNIFICATION_RATIO', '-')
      .replace(':WEIGHT', '-')
      .replace(':HREF', product.shop_url);
    var categories = productPreviewInfoEl.querySelectorAll('[data-category]');
    Array.prototype.forEach.call(categories, function(category) {
      if (product.category.indexOf(category.dataset.category) !== -1) {
        category.classList.add('product-detail__preview__info__category--active');
      }
    });
  }

  this.renderPreview = renderPreview;
}
function ProductSlide(bus, productSlideEl, productCommentEl) {
  var template = '<div class="swiper-slide">' +
                    '<div class="product-gallery__item__wrapper">' +
                      '<div class="product-gallery__item">' +
                        '<img src=":SRC">' +
                      '</div>' +
                    '</div>' +
                  '</div>';
  var topCarousel = null;
  var thumbsCarousel = null;

  function removeAllSlides() {
    topCarousel.removeAllSlides();
    thumbsCarousel.removeAllSlides();
  }
  function renderGallery(productImg) {
    productImg.forEach(function(img, index) {
      topCarousel.addSlide(index, template.replace(':SRC', img));
      thumbsCarousel.addSlide(index, template.replace(':SRC', img));
    });
  }
  function init() {
    thumbsCarousel = new Swiper(productSlideEl.querySelector('.gallery-thumbs'), {
      spaceBetween: 10,
      slidesPerView: 5,
      freeMode: true,
      watchSlidesVisibility: true,
      watchSlidesProgress: true,
    });
    topCarousel = new Swiper(productSlideEl.querySelector('.gallery-top'), {
      spaceBetween: 10,
      navigation: {
        nextEl: '#js-gallery-carousel-next',
        prevEl: '#js-gallery-carousel-prev',
      },
      thumbs: {
        swiper: thumbsCarousel
      }
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
      productSlideEl.style.opacity = '';
      productSlideEl.style.height = '';
    }, 300);
  };
}
// product comparison
function ProductComparison(bus, productComparisonEl, productComparisonBtnEl, products) {
  var checkedProducts = [];
  var productsByGroup = {};
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
  products.forEach(function(product, index) {
    productsByGroup[product.group].push({
      data: product,
      el: null,
      input: null,
      checked: false,
      index: index
    });
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
      label: '<div class="product-compare__header__label">:GROUP</div>',
      item: '<div class="product-compare__header__item" data-header-item data-product-group=":GROUP" data-product-index=":INDEX">' +
              '<label class="product-compare__header__item__label">' +
                '<input type="checkbox" class="product-compare__header__item__checkbox">' +
                '<img src=":SRC" class="product-compare__header__item__product-img">' +
                '<p class="product-compare__header__item__product-name">:NAME</p>' +
                '<p class="product-compare__header__item__product-price">:PRICE</p>' +
              '</label>' +
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
      var itemGroup = item.dataset.productGroup;
      var itemCheckbox = item.querySelector('input[type="checkbox"]');
      var productObj = productsByGroup[itemGroup][itemIndex];
      productObj.el = item;
      productObj.input = itemCheckbox;
      productObj.checked = itemCheckbox.checked;
    });
    productComparisonEl.addEventListener('change', function(e) {
      var target = e.target;
      var productEl = target.closest('[data-product-index][data-product-group]');
      if (productEl) {
        var itemIndex = productEl.dataset.productIndex;
        var itemGroup = productEl.dataset.productGroup;
        productsByGroup[itemGroup][itemIndex].checked = target.checked;
      }
    });
    productComparisonBtnEl.addEventListener('click', function() {
      filterChecked();
      bus.emitEvent(EVENTS.COMPARISON.FILTER_CHECKED, [checkedProducts]);
    });
  }

  function renderHeader(groupName, groupProducts) {
    var headerLabelHTML = templates.header.label.replace(':GROUP', groupName);
    var headerItemsHTML = '';
    groupProducts.forEach(function(product, index) {
      headerItemsHTML += templates.header.item
        .replace(':INDEX', index)
        .replace(':GROUP', product.data.group)
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
      groupProducts.forEach(function(product, index) {
        rowItems += templates.body.rowItem
          .replace(':INDEX', index)
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
    var activeProductIndex = productsByGroup[data.group].findIndex(function(product) {
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
      activeProduct = productsByGroup[data.group][activeProductIndex].el;
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
  }

  function hideItems(key, index) {
    var itemsToHide = productComparisonEl
      .querySelectorAll('[data-product-group="' + key + '"][data-product-index="' + index + '"]');
    Array.prototype.forEach.call(itemsToHide, function(item) {
      item.style.display = 'none';
    });
  }

  function filterChecked() {
    checkedProducts = [];
    var groupKeys = Object.keys(productsByGroup);
    groupKeys.forEach(function(key) {
      productsByGroup[key].forEach(function(product, index) {
        if (!product.checked) {
          hideItems(key, index);
        } else {
          checkedProducts.push(product.index);
        }
      });
    });
  }

  function filterBy(filtersData) {
    var filterKeys = Object.keys(filtersData);
    var groupKeys = Object.keys(productsByGroup);
    if (filterKeys.length) {
      filterKeys.forEach(function(filterKey) {
        groupKeys.forEach(function(key) {
          productsByGroup[key].forEach(function(product, index) {
            if (product.data.hasOwnProperty(filterKey)
              && filtersData[filterKey].includes(product.data[filterKey])) {
              showItems(key, index);
            } else {
              hideItems(key, index);
              product.input.checked = false;
              product.checked = false;
            }
          });
        });
      });
    } else {
      groupKeys.forEach(function(key) {
        productsByGroup[key].forEach(function(product, index) {
          showItems(key, index);
        });
      });
    }
    
  }

  function reset() {
    var groupKeys = Object.keys(productsByGroup);
    groupKeys.forEach(function(key) {
      productsByGroup[key].forEach(function(product, index) {
        if (!product.checked) {
          showItems(key, index);
        } else {
          product.input.checked = false;
          product.checked = false;
        }
      });
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
}
// script
var bus = new EventEmitter();

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
    document.getElementById('filters-aside-btn'),
    products
);

// product detail
// product preview carousel
var productPreviewCarousel = new ProductPreviewCarousel(
    bus,
    document.getElementById('selected-product-carousel')
);
// product preview info
var productPreviewInfo = new ProductPreviewInfo(
    bus,
    document.getElementById('selected-product-info')
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
    document.getElementById('selected-product-gallery'),
    document.getElementById('selected-product-comment')
);

// product comparison
var productComparison = new ProductComparison(
    bus,
    document.getElementById('product-comparison'),
    document.getElementById('product-compare-show-checked-btn'),
    products
);

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
});
bus.addListener(EVENTS.FILTERS.CLEARED, function() {
    productComparison.reset();
});
bus.addListener(EVENTS.COMPARISON.FILTER_CHECKED, function(data) {
    hideProductSectionOverlay();
    filter.showClearFilterOverlay();
    productGrid.matchComparison(data);
});
bus.addListener(EVENTS.PRODUCTS.ITEM_ACTIVATED, function(data) {
    hideProductSectionOverlay();
    productPreviewCarousel.renderPreview(data);
    productPreviewInfo.renderPreview(data);
    productSlide.renderGallery(data);
    productComparison.highlightActive(data);
});
bus.addListener(EVENTS.FILTERS.SELECT_ALL, function() {
    menu.collapse();
    showProductSectionOverlay();
    productComparison.scroll();
});

productPreviewCarousel.init();
productSlide.init();
productComparison.init();
productGrid.init();
