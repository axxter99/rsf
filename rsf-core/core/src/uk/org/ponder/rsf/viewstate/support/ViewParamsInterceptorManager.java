/*
 * Created on 18 May 2007
 */
package uk.org.ponder.rsf.viewstate.support;

import java.util.List;

import uk.org.ponder.rsf.viewstate.AnyViewParameters;
import uk.org.ponder.rsf.viewstate.ViewParameters;
import uk.org.ponder.rsf.viewstate.ViewParamsInterceptor;
import uk.org.ponder.util.Logger;

public class ViewParamsInterceptorManager implements ViewParamsInterceptor {
  private List interceptors;
  private ViewParameters inferred;

  // This is a list of ViewParamsInterceptor
  public void setInterceptors(List interceptors) {
    this.interceptors = interceptors;
  }

  public void setViewParameters(ViewParameters inferred) {
    this.inferred = inferred;
  }

  public AnyViewParameters getAdjustedViewParameters() {
    ViewParameters adjust = (ViewParameters) inferred.get();
    AnyViewParameters adjusted = adjustViewParameters(adjust);
    return adjusted == null? adjust : adjusted;
  }

  public AnyViewParameters adjustViewParameters(ViewParameters incoming) {
    ViewParameters togo = null;
    if (interceptors != null) {
      for (int i = 0; i < interceptors.size(); ++i) {
        ViewParamsInterceptor interceptor = (ViewParamsInterceptor) interceptors
            .get(i);
        try {
          AnyViewParameters newadjust = interceptor
              .adjustViewParameters(incoming);
          if (newadjust != null) {
            if (!(newadjust instanceof ViewParameters)) {
              return newadjust;
            }
            else {
              togo = (ViewParameters) newadjust;
            }
          }
        }
        catch (Exception e) {
          Logger.log.warn("Error adjusting ViewParameters", e);
        }
      }
    }
    return togo;
  }

}
