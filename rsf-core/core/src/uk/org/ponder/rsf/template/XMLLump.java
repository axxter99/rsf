/*
 * Created on Jul 27, 2005
 */
package uk.org.ponder.rsf.html;

import java.util.HashMap;

import uk.org.ponder.rsf.components.SplitID;

/**
 * @author Antranig Basman (antranig@caret.cam.ac.uk)
 * 
 */
public class XMLLump {
  // This string is used as separator between transition entries in forwardmap,
  // of the form "old-id-suffix  new-id-suffix"
  public static final String TRANSITION_SEPARATOR = "  ";
  public int lumpindex;
  public int line, column;
  public int nestingdepth;
  public String text;
  public String rsfID;
  XMLLump open_end = null;        // lump containing " >"
  XMLLump close_tag = null;       // lump containing "</close">
  // open and close will be the same for empty tag case " />"

  XMLLumpMMap downmap = null;
  
  // map from attribute name to lump where value occurs.
  // this may be reformed to map to text if we collapse attribute lumps?
  public HashMap attributemap = null;
  // the (XHTML) attribute appearing in the template file designating a 
  // template component. 
  public static final String ID_ATTRIBUTE = "rsf:id";
  // A value for the rsf:id attribute representing a component that needs
  // URL rewriting (issued URLs beginning with root /). NEVER issue a component
  // with this ID!
  public static final String URL_REWRITE = "rewrite-url";
  // A value for the rsf:id attribute indicating that the actual (leaf) component
  // to be targetted by component rendering is somewhere inside the component
  // holding the ID. NEVER issue a component with this ID! In this case, the
  // component holding the ID will be either a div or a span.
  public static final String PAYLOAD_COMPONENT = "payload-component";
  // this occurs in the SAME CONTAINER scope as the target???
  public static final String FORID_PREFIX = "message-for" + SplitID.SEPARATOR;
  public XMLLump() {}
  public XMLLump(int lumpindex, int nestingdepth) {
    this.lumpindex = lumpindex;
    this.nestingdepth = nestingdepth;
  }
  public static String tagToText(String tagname) {
    return "<" + tagname + " ";
  }
  public static String textToTag(String text) {
    return text.substring(1, text.length() - 1);
  }
}
