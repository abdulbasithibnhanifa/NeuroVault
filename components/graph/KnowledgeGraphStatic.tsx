"use client";

import React, { forwardRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

/**
 * KnowledgeGraphStatic - A wrapper around ForceGraph2D.
 * To support refs with next/dynamic, we use the forwardedRef prop.
 */
const KnowledgeGraphStatic = ({ forwardedRef, ...props }: any) => {
  return <ForceGraph2D {...props} ref={forwardedRef} />;
};

KnowledgeGraphStatic.displayName = 'KnowledgeGraphStatic';

export default KnowledgeGraphStatic;
