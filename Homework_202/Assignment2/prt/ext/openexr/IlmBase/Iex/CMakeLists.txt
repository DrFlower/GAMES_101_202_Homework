# yue.nicholas@gmail.com

IF(ILMBASE_BUILD_SHARED_LIBS)
    ADD_DEFINITIONS(-DIEX_EXPORTS)
ENDIF()

ADD_LIBRARY ( Iex ${LIB_TYPE}
  IexBaseExc.cpp
  IexThrowErrnoExc.cpp
  )


INSTALL ( TARGETS
  Iex
  DESTINATION
  ${OPENEXR_INSTALL_LIB_DEST}
)

INSTALL ( FILES 
  IexBaseExc.h
  IexMathExc.h
  IexThrowErrnoExc.h
  IexErrnoExc.h
  IexMacros.h
  Iex.h
  IexNamespace.h
  IexExport.h
  IexForward.h
  DESTINATION
  ${OPENEXR_INSTALL_HEADER_DEST}
)
