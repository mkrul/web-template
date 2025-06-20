import React from 'react';
import ReactDOMClient from 'react-dom/client';

import { IntlProvider } from '../../../util/reactIntl';

import css from './SearchMap.module.css';

/**
 * ReusableMapContainer makes Google Map usage more effective. This improves:
 * - Performance: no need to load dynamic map every time user enters the search page view on SPA.
 * - Efficient Google Maps usage: less unnecessary calls to instantiate a dynamic map.
 * - Reaction to a bug when removing Google Map instance
 *   https://issuetracker.google.com/issues/35821412
 *
 * @component
 * @param {Object} props
 * @param {React.Node} props.children - The children
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} props.reusableMapHiddenHandle - The handle for the reusable map hidden
 * @param {Object} props.messages - The messages for IntlProvider
 * @param {Object} props.config - The config
 * @returns {JSX.Element}
 */
class ReusableMapContainer extends React.Component {
  constructor(props) {
    super(props);

    if (typeof window !== 'undefined') {
      window.reusableSearchMapElement =
        window.reusableSearchMapElement || document.createElement('div');

      if (!props.className) {
        console.warn(
          'ReusableMapContainer should get className prop which defines its layout'
        );
      }
      // If no className is given, we use some defaults, which makes it easier to debug loading.
      const mapLayoutClassName = props.className || css.defaultMapLayout;

      this.el = window.reusableSearchMapElement;
      this.el.id = 'search-map';
      this.el.classList.add(mapLayoutClassName);
    }

    this.mountNode = null;
    this.renderSearchMap = this.renderSearchMap.bind(this);
  }

  componentDidMount() {
    this.renderSearchMap();
  }

  componentDidUpdate() {
    this.renderSearchMap();
  }

  componentWillUnmount() {
    this.el.classList.add(css.reusableMapHidden);
    this.el.classList.add(this.props.reusableMapHiddenHandle);
    this.mountNode.removeChild(this.el);
    document.body.appendChild(this.el);
  }

  renderSearchMap() {
    // Prepare rendering child (MapWithGoogleMap component) to new location
    // We need to add translations (IntlProvider) for map overlay components
    //
    // NOTICE: Children rendered with ReactDOM.render doesn't have Router access
    // You need to provide onClick functions and URLs as props.
    const renderChildren = () => {
      const { config, messages } = this.props;
      const children = (
        <IntlProvider
          locale={config.localization.locale}
          messages={messages}
          textComponent="span"
        >
          {this.props.children}
        </IntlProvider>
      );

      // Render children to created element
      // TODO: Perhaps this should use createPortal instead of createRoot.
      // (The question is if portal re-initializes the map - which is pricing factor.)
      window.mapRoot = window.mapRoot || ReactDOMClient.createRoot(this.el);
      window.mapRoot.render(children);
    };

    const targetDomNode = document.getElementById(this.el.id);

    // Check if we have already added map somewhere on the DOM
    if (!targetDomNode) {
      if (this.mountNode && !this.mountNode.firstChild) {
        // If mountable, but not yet mounted, append rendering context inside SPA rendering tree.
        this.mountNode.appendChild(this.el);
      } else if (!this.mountNode) {
        // if no mountNode is found, append this outside SPA rendering tree (to document body)
        document.body.appendChild(this.el);
      }
      renderChildren();
    } else {
      this.el.classList.remove(css.reusableMapHidden);
      this.el.classList.remove(this.props.reusableMapHiddenHandle);

      if (this.mountNode && !this.mountNode.firstChild) {
        // Move the map to correct location if we have rendered the map before
        // (but it's not yet moved to correct location of rendering tree).
        document.body.removeChild(this.el);
        this.mountNode.appendChild(this.el);

        // render children and call reattach
        renderChildren();
        this.props.onReattach();
      } else {
        renderChildren();
      }
    }
  }

  render() {
    return (
      <div
        className={css.reusableMap}
        ref={(node) => {
          this.mountNode = node;
        }}
      />
    );
  }
}

export default ReusableMapContainer;
