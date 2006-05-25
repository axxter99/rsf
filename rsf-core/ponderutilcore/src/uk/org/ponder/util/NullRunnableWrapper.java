/*
 * Created on Nov 11, 2005
 */
package uk.org.ponder.util;

/** Passes through the supplied Runnable unchanged. Used by clients where no
 * wrapping code is actually desired to surround the Runnable invokation.
 * @author Antranig Basman (antranig@caret.cam.ac.uk)
 *
 */
public class NullRunnableWrapper implements RunnableWrapper {
  public Runnable wrapRunnable(Runnable towrap) {
    return towrap;
  }
}
