/*
 * Created on Aug 5, 2005
 */
package uk.org.ponder.errorutil;

import uk.org.ponder.streamutil.write.PrintOutputStream;
import uk.org.ponder.xml.XMLWriter;

/**
 * @author Antranig Basman (antranig@caret.cam.ac.uk)
 * 
 */
public class ErrorUtil {
  public static void dumpStackTrace(Throwable t, PrintOutputStream pos) {
    pos.println(t.getMessage());
    StackTraceElement[] elements = t.getStackTrace();
    for (int i = 0; i < elements.length; ++ i) {
      pos.println(elements[i]);
    }
  }
  public static void dumpStackTraceXML(Throwable t, PrintOutputStream pos) {
    XMLWriter xmlw = new XMLWriter(pos);
    xmlw.write(t.getMessage() + "\n");
    StackTraceElement[] elements = t.getStackTrace();
    for (int i = 0; i < elements.length; ++ i) {
      xmlw.write(elements[i] + "\n");
    }
  }
}
