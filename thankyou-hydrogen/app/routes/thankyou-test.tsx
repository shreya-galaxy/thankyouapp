export function loader() {
  return null;
}

import {useRouteLoaderData} from 'react-router';

export default function TestRoute() {
  // Render static placeholders that the hydrator will populate client-side
  const rootData = useRouteLoaderData('root') as any;
  const publicStoreDomain = rootData?.publicStoreDomain || '';

  return (
    <div>
      <section>
        <h2>Image Block</h2>
        <div className="thankyou-placeholder" data-type="image" data-shop={publicStoreDomain}></div>
      </section>
      <section>
        <h2>Video Block</h2>
        <div className="thankyou-placeholder" data-type="video" data-shop={publicStoreDomain}></div>
      </section>
      <section>
        <h2>FAQ Block</h2>
        <div className="thankyou-placeholder" data-type="faq" data-shop={publicStoreDomain}></div>
      </section>
    </div>
  );
}
