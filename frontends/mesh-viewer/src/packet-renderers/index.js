import RfidTagUpdate from './RfidTagUpdate';
import UnknownTagType from './UnknownTagType';

const renderers = {
  'mesh.rfid.tag_update': RfidTagUpdate,
  'unknown': UnknownTagType,
};

export default renderers;